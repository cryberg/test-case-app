Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items: [
        {
            xtype: 'container',
            itemId: 'exportBtn'
        },
        {
            xtype: 'container',
            itemId: 'milestoneCombobox',
            label: 'test'
        },
        {
            xtype: 'container',
            itemId: 'gridContainer'
        }
    ],
    launch: function() {
        this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Loading data..."});
        this._myMask.show();
        
        this.down('#milestoneCombobox').add({
            xtype: 'rallymilestonecombobox',
            itemId: 'stateComboBox',
            allowNoEntry: true,
            model: ['TestCase'],
            listeners: {
                scope: this,
                select: this._onSelect,
                ready: this._initStore
            },
        });
   },
    _getStateFilter: function() {
        return {
            property: 'Milestones',
            operator: '=',
            value: this.down('#stateComboBox').getValue()
        };
    },
    _onSelect: function() {
        // this._grid.store.filter(this._getStateFilter());
        var grid = this.down('rallygrid'),
            store = grid.getStore();
    
        store.clearFilter(true);
        store.filter(this._getStateFilter());
    },
   _initStore: function() {
        Ext.create('Rally.data.wsapi.Store', {
            model: 'TestCase',
            autoLoad: true,
            remoteSort: false,
            fetch:[
        	    "FormattedID", 
            	"Name",
            	"Type",
            	"LastRun",
            	"LastVerdict"
        	],
            limit: Infinity,
            // filters: this._getStateFilter,
            listeners: {
                load: this._onDataLoaded,
                scope:this
            }
       });
    },
    _onDataLoaded: function(store, data) {
        this._makeGrid(data);
    },
    
    _makeGrid:function(testcases){
        this._myMask.hide();
        var store = Ext.create('Rally.data.custom.Store', {
            data: testcases  
        });
        this._testcases = testcases;
        this._grid = Ext.create('Rally.ui.grid.Grid',{
            itemId: 'testcasesGrid',
            store: store,
            showRowActionsColumn: false,
            columnCfgs: [
                { 
                	text: "ID", dataIndex: "FormattedID", xtype: "templatecolumn",
                	tpl: Ext.create("Rally.ui.renderer.template.FormattedIDTemplate"),
                }, {
                    text: "Name", dataIndex: "Name", flex: 1
                }, {
                    text: "Type", dataIndex: "Type"
                }, {
                    text: "Date of Last Run", dataIndex: "LastRun"
                }, {
                    text: "Run Pass/Fail", dataIndex: "LastVerdict"
                }
            ]
        });
        this.down('#gridContainer').add(this._grid);
        this.down('#exportBtn').add({
            xtype: 'rallybutton',
            text: 'Export to CSV',
            handler: this._onClickExport,
            scope: this
        });
    },

    _onClickExport: function(){
        var data = this._getCSV();
        window.location = 'data:text/csv;charset=utf8,' + encodeURIComponent(data);
    },
    
    _getCSV: function () {
        var cols    = this._grid.columns;
        var store   = this._grid.store;
        var data = '';
        
        _.each(cols, function(col, index) {
            data += this._getFieldTextAndEscape(col.text) + ',';
        },this);
        
        data += "\r\n";
        _.each(this._testcases, function(record) {
            // var featureData = record["Feature"];
            _.each(cols, function(col, index) {
                var text = '';
                var fieldName   = col.dataIndex;
                // if (fieldName === "Feature" && featureData) {
                //     text = featureData.FormattedID;
                // } else if (fieldName === "TestCaseCount") {
                //     text = record[fieldName].toString();
                // } else if (fieldName === "TestCases"){
                //     var textArr = [];
                //     _.each(record[fieldName], function(testcase, index) {
                //         textArr.push(testcase.FormattedID);
                //     });
                //     text = textArr.join(', ');
                // } else{
                    text = record.get(fieldName);
                // }
                
                data += this._getFieldTextAndEscape(text) + ',';

            },this);
            data += "\r\n";
        },this);

        return data;
    },
    _getFieldTextAndEscape: function(fieldData) {
        var string  = this._getFieldText(fieldData);  
        return this._escapeForCSV(string);
    },
    _getFieldText: function(fieldData) {
        var text;
        if (fieldData === null || fieldData === undefined || !fieldData.match) {
            text = '';
        } else if (fieldData._refObjectName) {
            text = fieldData._refObjectName;
        }else {
            text = fieldData;
        }
        return text;
    },
     _escapeForCSV: function(string) {
        if (string.match(/,/)) {
            if (!string.match(/"/)) {
                string = '"' + string + '"';
            } else {
                string = string.replace(/,/g, ''); 
            }
        }
        return string;
    }
});