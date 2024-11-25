'use strict';
const { IssueModel } = require('../mongooseModel');
module.exports = function (app) {

  app.route('/api/issues/:project')
    .get(async function (req, res) {
      let project = req.params.project;
      const index = req.url.indexOf('?');
      const urlParams = new URLSearchParams(req.url.substring(index + 1));
      const created_by = urlParams.get('created_by');
      const assigned_to = urlParams.get('assigned_to');
      let open = urlParams.get('open');
      const _id = urlParams.get('_id');
      const issue_title = urlParams.get('issue_title');
      if (_id) {
        return res.send([await IssueModel.findById(_id).exec()]);
      }
      let modelQuery = IssueModel.find({projectName:project});
      if (created_by) {
        modelQuery = modelQuery.find({ created_by });
      }
      if (assigned_to) {
        modelQuery = modelQuery.find({ assigned_to });
      }
      if (open !== null) {
        open = open === 'true';
        modelQuery = modelQuery.find({ open });
      }
      if (issue_title) {
        modelQuery = modelQuery.find({
          issue_title: { $regex: issue_title, $options: 'i' } // 'i' for case-insensitive search
        });
      }
      const result = await modelQuery.exec();
      return res.send(result);
    })
    .post(async function (req, res) {
      let project = req.params.project;
      const { issue_title, issue_text, created_by = '', assigned_to = '', status_text = '' } = req.body;
      if (!issue_text || !issue_title || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }
      const result = await IssueModel.create({ issue_text, issue_title, created_by, assigned_to, status_text,projectName:project });
      return res.json(result)
    })
    .put(async function (req, res) {
      const {_id} = req.body;
        let project = req.params.project;
        const bodyEntries = Object.entries(req.body);
        const updatedData = {};
        if (!_id) {
          return res.json({ error: 'missing _id' });
        }
        // check if update field is empty
        if(bodyEntries.every(([key,value])=> value===''||key==='_id')){
          return res.json({ error: 'no update field(s) sent', '_id': _id });
        }
        //add update data
        bodyEntries.forEach(([key,value]) => {
          if(key!=='_id'){
            if(key==='open'){
              const open = value === 'true';
              updatedData['open'] = open;
            }else if(value!==''){
              updatedData[key]=value;
            }
          }
        });
        updatedData['updated_on'] = Date.now();
        const result = await IssueModel.findByIdAndUpdate(_id,updatedData);
        if(!result) return res.json({ error: 'could not update', '_id': _id });
        return res.json({  result: 'successfully updated', '_id': _id })
    })
    .delete(async function (req, res) {
      const {_id} = req.body;
        let project = req.params.project;
      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      const result = await IssueModel.findByIdAndDelete(_id);
      if(!result) return res.json({ error: 'could not delete', '_id': _id });
      return res.json({ result: 'successfully deleted', '_id': _id });
    });
};
