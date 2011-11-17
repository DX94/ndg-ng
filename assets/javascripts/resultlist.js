/*
 * File encapsulates action related to Result List view
 *
 **/

var ResultList = function() {

    var currentSurveyId;
    var allResultSelected = false;
    var selectedResults = new Array();
    var searchLabels;
    var searchIds;
    var searchDbFields = ["title", "latitude", "startTime", "ndgUser.username"];
    var searchBy = "title";

    return {showResultList : function(i) { showResultList(i);},
            selectAllResults : function(){ selectAllResults();},
            selectAllVisibleResults : function() { selectAllVisibleResults();},
            unselectAllResults : function(){ unselectAllResults();},
            fillWithData: function(i, item) {fillWithData(i, item);},
            loadingFinished: function() {loadingFinished();},
            searchFieldChange: function(event){searchFieldChange(event);},
            getSearchBy: function() {return searchBy;},
            prepareLayout: function(tableHtml){prepareLayout(tableHtml);}
    };

    function backToSurveyList() {
        SurveyList.showSurveyList();
    }

    function showResultList(i) {
        selectedResults = new Array();
        currentSurveyId = i.data;

        var columnIds = ["checkboxColumnId", "executeSortByResultId", "executeSortByResultTitle", "executeSortByDateSent", "executeSortByUser", "executeSortByLocation"];
        var columnTexts = [null, "LOC_RESULTID", "LOC_RESULTTITLE", "LOC_DATESENT", "LOC_USER", "LOC_LOCATION"];
        var columnDbFields = [null, "resultId", "title", "startTime", "ndgUser.username", "latitude"];
        var ajaxParams = { surveyId: currentSurveyId};

        setupLeftColumn();

        DynamicTable.showList(columnIds, columnTexts, columnDbFields, "results", ResultList, ajaxParams);

        $('#sectionTitle').text(LOC.get('LOC_RESULT_LIST'));
        $('#userManagement').text('');

        $('#searchComboBox').click( function(event) {createSearchList(event);});
        $('#searchComboText').text(LOC.get("LOC_RESULTTITLE"));

        prepareContentToolbar();
    }

    function prepareLayout(tableHtml) {
        $('#minimalist').empty();
        $('#minimalist').append(tableHtml);
        $('#minimalist').addClass('resultListTable');
        $('#content').addClass('resultListTable');
        $('#contentToolbar').addClass('resultListTable');
    }

    function setupLeftColumn() {
        $('#leftColumn').empty('resultListTable');
        $('#leftColumn').addClass('resultListTable');
        var columnContent = '<div class="resultListLeftMenu">';
        columnContent += '<span id ="backResults" class="buttonBack"></span>';
        columnContent += '<span id="mapView" class="buttonMapView resultListButton">';
        columnContent += LOC.get('LOC_MAP_VIEW');
        columnContent +=  '</span>';
        columnContent += '<span id="exportContextMenu" class="buttonExport resultListButton">';
        columnContent += LOC.get('LOC_EXPORT_TO');
        columnContent +=  '</span>';
        columnContent +=  '</div>';

        $('#leftColumn').append( columnContent );
        $('#backResults').click( function(){backToSurveyList()} );

    }

    function createSearchList(event) {
       searchLabels = [LOC.get("LOC_RESULTTITLE"), LOC.get("LOC_LOCATION"), LOC.get("LOC_DATESENT"), LOC.get("LOC_USER")];
       searchIds = [ "searchByTitle", "searchByLocation", "searchByDate", "searchByUser"];
       SurveyListCombo.showSearchMenu(event, searchLabels, searchIds, ResultList);
    }

    function fillWithData(i, item) {
        $('#dynamicListTable').append( '<tr class="itemTextColor" id="dynamicRow' + i + '">'
                                    + '<td class="resultCheckboxPaddingClass"><input type="checkbox" class="resultCheckboxClass" id="resultCheckbox' + item.id + '"/></td>'
                                    + '<td>'+ item.resultId + '</td>'
                                    + '<td>' + item.title + '</td>'
                                    + '<td>' + new Date( item.startTime ).toString("dd/MM/yy") + '</td>'
                                    + '<td>' + item.ndgUser.username + '</td>'
                                    + '<td>' + ( item.latitude!= null ? 'OK': 'NO GPS' ) + '</td>'
                                    + '</tr>' );

        $( '#resultCheckbox' + item.id ).bind( 'check uncheck', item.id, function(i){resultCheckboxClicked(i);} )
    }

    function resultCheckboxClicked(i) {
        if( i.currentTarget.checked ) {
            if ( -1 == jQuery.inArray( i.data, selectedResults ) ) {
                selectedResults.push( i.data );
            }
        } else {
            if ( -1 != jQuery.inArray( i.data, selectedResults ) ) {
                selectedResults.splice(jQuery.inArray( i.data, selectedResults ), 1 );
            }
        }
    }

    function exportResults() {
        if( allResultSelected ) {
            ExportResults.exportAllResults( currentSurveyId );
        } else {
            ExportResults.exportResults( currentSurveyId, selectedResults );
        }
    }

    function prepareContentToolbar() {
//        $('#contentToolbar').append( '<span class="comboBoxSelection" id="comboBoxSelection" unselectable="on"></span>');
//        $('#contentToolbar').append( '<span class="buttonExportExcel" id="buttonExportExcel" unselectable="on"></span>');
//        $('#contentToolbar').append( '<span class="buttonExportKML" id="buttonExportKML" unselectable="on"></span>');
//        $('#contentToolbar').append( '<span class="buttonExportExternal" id="buttonExportExternal" unselectable="on"></span>');
//        $('#contentToolbar span').mousedown(function() { onButtonMouseDownHandler($(this));} );
//        $('#comboBoxSelection').click( function(event) { SurveyListCombo.showResultSelectionMenu(event); } );
//        $('#buttonExportExcel').click( function(event) { exportResults(); } );

    }

    function onButtonMouseDownHandler(source) {
        source.addClass('pushed');
        $(document).bind('mouseup.resultBar', function() {
            $('.pushed').removeClass('pushed');
            $('body').unbind('mouseup.resultBar');
            return false; });
        return false;
    }

    function selectAllVisibleResults() {
        var checkboxes = $(".resultCheckboxClass");

        $.each( checkboxes ,function( i, item ) {
            item.checked = true;
        });
    }

    function selectAllVisibleResults() {
        doSelectAllVisibleResults();
        allResultSelected = false;
    }

    function doSelectAllVisibleResults() {
        var checkboxes = $(".resultCheckboxClass");

        $.each( checkboxes ,function( i, item ) {
            item.checked = true;
        });
    }

    function selectAllResults() {
        selectAllVisibleResults();
        allResultSelected = true;
    }

    function unselectAllResults() {
        var checkboxes = $(".resultCheckboxClass");

        $.each( checkboxes ,function( i, item ) {
            item.checked = false;
        });
        allResultSelected = false;
    }

    function loadingFinished() {
         $('input:checkbox:not([safari])').checkbox({cls:'customCheckbox', empty:'../images/empty.png'});
         if( allResultSelected ) {
            doSelectAllVisibleResults();
         }
    }

    function searchFieldChange(event) {
        var fieldId = event.currentTarget.id;
        var nameIndex = jQuery.inArray( fieldId, searchIds );
        $('#searchComboText').text(searchLabels[nameIndex]);
        searchBy = searchDbFields[nameIndex];
        $('#searchTextField').val("");
    }

}();