const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');
const {ObjectId} = require('mongodb')
const { IssueModel } = require('../mongooseModel');

chai.use(chaiHttp);

suite('Functional Tests', async function() {
    this.timeout(15000);
    //create dummy data
    const issueTestCreate = (index)=>({
        projectName:'apitest',
        issue_title: 'Create an issue with to test view',
        issue_text: 'This is a test that create an issue with to test view',
        created_by: 'User_'+index,
        open:index%2===0,
    });
    //#1
    test('Create an issue with every field',(done)=>{
        const issueTest = {
            issue_title: 'Create an issue with missing field',
            issue_text: 'This is a test that create an issue with only required fields',
            created_by: 'Test 2',
        };
        chai.request(server).keepOpen().post('/api/issues/apitest').send(issueTest).end(async (err,res)=>{
            const objEntries = Object.entries(issueTest);
            assert.equal(200,res.status);
            for(let i=0;i<objEntries.length;i++){
                const [key,value] = objEntries[i];
                assert.equal(value,res.body[key]);
            }
            //delete test
            await IssueModel.findByIdAndDelete(res.body._id).exec();
            done();
        })
    })
    //#2
    test('Create an issue with only required fields',(done)=>{
        const issueTest = {
            issue_title: 'Create an issue with only required field',
            issue_text: 'This is a test that create an issue with only required fields',
            created_by: 'Test 2',
        };
        chai.request(server).keepOpen().post('/api/issues/apitest').send(issueTest).end(async (err,res)=>{
            const objEntries = Object.entries(issueTest);
            assert.equal(200,res.status);
            for(let i=0;i<objEntries.length;i++){
                const [key,value] = objEntries[i];
                assert.equal(value,res.body[key]);
            }
            //delete test
            await IssueModel.findByIdAndDelete(res.body._id).exec();
            done();
        })
    })
    //#3
    test('Create an issue with missing required fields',(done)=>{
        const issueTestNoCreatedBy = {
            issue_title: 'Create an issue with missing field',
            issue_text: 'This is a test that create an issue with missing required fields',
            // created_by: 'Test 2',
        };
        chai.request(server).keepOpen().post('/api/issues/apitest').send(issueTestNoCreatedBy).end((err,res)=>{
            assert.deepEqual({ error: 'required field(s) missing' },res.body);
            done();
        })
    });

    // #4
    test('View issues on a project',(done)=>{
        const deleteID = [];
        const data = [0,1,2,3,4,5].map((val)=>issueTestCreate(val));
        const dataDummy = IssueModel.insertMany(data).then(data=>{
            data.forEach(dummy=>deleteID.push(dummy._id));
            chai.request(server).keepOpen().get('/api/issues/apitest').end((err,res)=>{
                assert.lengthOf(res.body,6);
                IssueModel.deleteMany({_id:{$in:deleteID}}).then(()=>done());
            })
        });

    })
    // // #5
    test('View issues on a project with one filter',(done)=>{
        const deleteID = [];
        const data = [0,1,2,3,4,5].map((val)=>issueTestCreate(val));
        IssueModel.insertMany(data).then(data=>{
            data.forEach(dummy=>deleteID.push(dummy._id));
            chai.request(server).keepOpen().get('/api/issues/apitest?s=1&open=true').end(async (err,res)=>{
                assert.lengthOf(res.body,Math.floor(3));
                IssueModel.deleteMany({_id:{$in:deleteID}}).then(()=>done());
            })
        })
    })
    // #6
    test('View issues on a project with multiple filter',(done)=>{
        const deleteID = [];
        const data = [0,1,2,3,4,5].map((val)=>issueTestCreate(val));
        IssueModel.insertMany(data).then(data=>{
            data.forEach(dummy=>deleteID.push(dummy._id));
            chai.request(server).keepOpen().get('/api/issues/apitest?s=1&open=true&created_by=User_4').end(async (err,res)=>{
                assert.lengthOf(res.body,1);
                assert.include(res.body[0],issueTestCreate(4));
                IssueModel.deleteMany({_id:{$in:deleteID}}).then(()=>done());
            })
    });
    })
    // #7
    test('Update one field on an issue',(done)=>{
        IssueModel.insertMany([issueTestCreate(0)]).then(([dataDummy])=>{
            chai.request(server).keepOpen().put('/api/issues/apitest').send({_id:dataDummy._id,assigned_to:'New_User'}).end(async (err,res)=>{
                assert.equal(res.body._id,dataDummy._id);
                assert.equal(res.body.result,'successfully updated');
                IssueModel.findByIdAndDelete({_id:dataDummy._id}).then(()=>done());
            })
        });
    })
    // #8
    test('Update multiple field on an issue',(done)=>{
        IssueModel.insertMany([issueTestCreate(0)]).then(([dataDummy])=>{
            chai.request(server).keepOpen().put('/api/issues/apitest')
            .send({_id:dataDummy._id,assigned_to:'New_User_2',issue_title:'New issue title'}).end(async (err,res)=>{
                assert.equal(res.body._id,dataDummy._id);
                assert.equal(res.body.result,'successfully updated');
                IssueModel.findByIdAndDelete({_id:dataDummy._id}).then(()=>done());
            })
        })
    })
    // #9
    test('Update field on an issue with missing _id',(done)=>{
        chai.request(server).keepOpen().put('/api/issues/apitest').send({assigned_to:'New_User_2',issue_title:'New issue title'}).end((err,res)=>{
            assert.deepEqual(res.body,{ error: 'missing _id' });
            done();
        })
    })
    // #10
    test('Update field on an issue with no fields to update',(done)=>{
        IssueModel.insertMany([issueTestCreate(0)]).then(([dataDummy])=>{
            chai.request(server).keepOpen().put('/api/issues/apitest').send({_id:dataDummy._id}).end(async (err,res)=>{
                assert.deepEqual(res.body,{ error: 'no update field(s) sent', '_id': dataDummy._id.toString() });
                IssueModel.findByIdAndDelete({_id:dataDummy._id}).then(()=>done());
            })
        })
    })
    //#11
    test('Update an issue with an invalid _id',(done)=>{
        const new_id = new ObjectId(); 
        chai.request(server).keepOpen().put('/api/issues/apitest').send({_id: new_id,issue_title:'Test Tilte'}).end((err,res)=>{
            assert.deepEqual(res.body,{ error: 'could not update', '_id': new_id.toString() });
            done();
        })
    })
    //#12
    test('Delete an issue',(done)=>{
        IssueModel.create(issueTestCreate(0)).then(dataDummy=>{
            chai.request(server).keepOpen().delete('/api/issues/apitest').send({_id:dataDummy._id}).end((err,res)=>{
                assert.deepEqual(res.body,{ result: 'successfully deleted', '_id': dataDummy._id.toString() });
                done();
            })
        });
    })
    //#13
    test('Delete an issue with an invalid _id',(done)=>{
        const new_id = new ObjectId(); 
        chai.request(server).keepOpen().delete('/api/issues/apitest').send({_id:new_id}).end((err,res)=>{
            assert.deepEqual(res.body,{ error: 'could not delete', '_id': new_id.toString() });
            done();
        })
    })
     //#14
     test('Delete an issue with missing _id',(done)=>{
        chai.request(server).keepOpen().delete('/api/issues/apitest').send({}).end(async (err,res)=>{
            assert.deepEqual(res.body,{ error: 'missing _id' });
            done();
        })
    })
})
