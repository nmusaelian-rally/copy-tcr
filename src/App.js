  Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select an Iteration:',
        labelWidth: 100,
        width: 300
    },
    
    
    onScopeChange: function() {
       if (this.down('#testSetComboxBox')) {
	    this.down('#testSetComboxBox').destroy();
	}
	if (this.down('#testCaseComboxBox')) {
	    this.down('#testCaseComboxBox').destroy();
	}
	if (this.down('#resultsGrid')) {
	    this.down('#resultsGrid').destroy();
	}
	var testSetComboxBox = Ext.create('Rally.ui.combobox.ComboBox',{
	    id: 'testSetComboxBox',
	    storeConfig: {
		model: 'TestSet',
		pageSize: 100,
		autoLoad: true,
		filters: [this.getContext().getTimeboxScope().getQueryFilter()]
	    },
	    fieldLabel: 'select TestSet',
	    listeners:{
                ready: function(combobox){
		    if (combobox.getRecord()) {
			this._onTestSetSelected(combobox.getRecord());
		    }
		    else{
			console.log('selected iteration has no testsets');
		    }
		},
                select: function(combobox){
		    if (combobox.getRecord()) {
			this._onTestSetSelected(combobox.getRecord());
		    }
			        
                },
                scope: this
            }
	});
	this.add(testSetComboxBox);  
    },
    
     _onTestSetSelected:function(selectedTestset){
	var testCases = selectedTestset.getCollection('TestCases', {fetch: ['FormattedID','ObjectID', 'Results']});
	var ts  = {
		    FormattedID: selectedTestset.get('FormattedID'),
		    TestCaseCount: selectedTestset.get('TestCases').Count,
		    TestCases: [],
		    ResultCount: 0 
		};
	testCases.load({
		callback: function(records, operation, success){
		    Ext.Array.each(records, function(testcase){
		    console.log("testcase.get('FormattedID')", testcase.get('FormattedID'));  
		    console.log("testcase.get('Results').Count", testcase.get('Results').Count); 
		    ts.ResultCount = testcase.get('Results').Count; 
		    ts.TestCases.push({_ref: testcase.get('_ref'),
			    FormattedID: testcase.get('FormattedID'),
			    ObjectID: testcase.get('ObjectID')
			    });
		  }, this); 
		  this._makeTestCaseCombobox(ts.TestCases);
		},
		scope: this
      });
	
    },
    
    _makeTestCaseCombobox:function(testcases){
	if (this.down('#testCaseComboxBox')) {
	    this.down('#testCaseComboxBox').destroy();
	}
	if (this.down('#resultsGrid')) {
	    this.down('#resultsGrid').destroy();
	}
	    if (testcases.length>0) {
		var idArray = [];
		_.each(testcases, function(testcase){
		    console.log(testcase);
		    console.log('OID', testcase['ObjectID']);
		    idArray.push(testcase['ObjectID']);
		    });
		console.log('idArray',idArray);
		
		var filterArray = [];
		_.each(idArray, function(id){
		    filterArray.push(
			{
			property: 'ObjectID',
			value:id
			}
		    )
		});
		 var filters = Ext.create('Rally.data.QueryFilter', filterArray[0]);
		 
		 filterArray = _.rest(filterArray,1);  
		 
		 _.each(filterArray, function(filter){
		    filters = filters.or(filter)
			},1);
    
		 var testCaseComboxBox = Ext.create('Rally.ui.combobox.ComboBox',{
		    id: 'testCaseComboxBox',
		    storeConfig: {
			model: 'TestCase',
			pageSize: 100,
			autoLoad: true,
			filters:filters,
			fetch: true
		    },
		    fieldLabel: 'select TestCase',
		    listeners:{
			ready: function(combobox){
			    if (combobox.getRecord()) {
				this._onTestCaseSelected(combobox.getRecord());
			    }
			    else{
				console.log('selected testset has no testcases');
			    }
			},
			select: function(combobox){
			    if (combobox.getRecord()) {
				this._onTestCaseSelected(combobox.getRecord());
			    }
					
			},
			scope: this
		    }
		});
		this.add(testCaseComboxBox); 
		}
		else{
		  console.log('selected testset has no testcases');
		  }
	},
	
    _onTestCaseSelected:function(selectedTestcase){
      var results = selectedTestcase.getCollection('Results', {fetch: ['ObjectID','Date', 'TestSet', 'TestCase', 'Build', 'Verdict']});
      var tc  = {
		    ObjectID: selectedTestcase.get('ObjectID'),
		    FormattedID: selectedTestcase.get('FormattedID'),
		    Results: [] 
		};
	results.load({
		callback: function(records, operation, success){
		    Ext.Array.each(records, function(result){
		    console.log("result.get('ObjectID')", result.get('ObjectID'));  
		    console.log("result.get('Verdict')", result.get('Verdict'));
		    tc.Results.push({_ref: result.get('_ref'),
			    ObjectID: result.get('ObjectID'),
			    Date: result.get('Date'),
			    Build: result.get('Build'),
			    Verdict: result.get('Verdict')
			    });
		  }, this); 
		  this._updateGrid(tc.Results);
		},
		scope: this
      });
    },
    
    _updateGrid: function(results){
	     var store = Ext.create('Rally.data.custom.Store', {
                data: results,
                pageSize: 100
            });
	    if (!this.down('#resultsGrid')) {
   		this._createGrid(store);
	    }
	    else{
   		this.down('#resultsGrid').reconfigure(store);
	    }
	 },
	 
  _createGrid: function(store){
	    var that = this;
	    var that = this;
	    var resultsGrid = Ext.create('Rally.ui.grid.Grid', {
		    id: 'resultsGrid',
		    store: store,
		    
		    columnCfgs: [
		    {
		       text: 'ObjectID ID', dataIndex: 'ObjectID',
		    },
		    {
			text: 'Date', dataIndex: 'Date',
		    },
		    {
			text: 'Build', dataIndex: 'Build',
		    },
		    {
		      text: 'Verdict', dataIndex: 'Verdict',
		    },
		    ],
		     listeners: {
			    celldblclick: function( grid, td, cellIndex, record, tr, rowIndex){
				that._copyRecordOnDoubleClick(record);     
			    }
		    }
	    });
	    this.add(resultsGrid);
	 },
	 
	 _copyRecordOnDoubleClick: function(record){
	  var that = this;
	     console.log('record', record);
	     Rally.data.ModelFactory.getModel({
                type: 'TestCaseResult',
                success: function(model) {  
                    that._model = model;
                    var copy = Ext.create(model, {
                        Date: record.get('Date'),
			Build: record.get('Build'),
			Verdict: record.get('Verdict'),
			TestCase: '/testcase/17237838118',
			TestSet: '/testset/17234968911'
                    });
                    copy.save({
                        callback: function(result, operation) {
                            if(operation.wasSuccessful()) {
                                console.log('result',result); 
                            }
                            else{
                                console.log("problem");
                            }
                        }
                    });
                }
            });
	 }  
 });
