const mongoose = require('mongoose');

mongoose.connect(process.env.dbURL).then(()=>console.log('successfully connected'),(err)=>console.log(err));

const IssueModel = mongoose.model('Issue',new mongoose.Schema({ 
    issue_title: {type:String,required:true},
    issue_text: {type:String,required:true},
    created_on: {type:Date,default:()=>Date.now()},
    updated_on: {type:Date,default:()=>Date.now()},
    created_by: {type:String,required:true},
    assigned_to: String,
    open: {type:Boolean,default:true},
    status_text: String,
    projectName: {type:String,required:true},
  },));

module.exports = {
    IssueModel,
}