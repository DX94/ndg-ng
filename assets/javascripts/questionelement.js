var QuestionUiElement = function( questionModel ){
    var question = questionModel;

    this.init = function(){
        $( '#'+ question.uiId + ' .typeSelect' ).val( question.questionType.id );
        $( '#'+ question.uiId + ' .typeSelect' ).live( 'change', function( ){onQuestionTypeChanged();} );
       
       appendDetails();
    }

    function appendDetails ()   {
        $( '#'+ question.uiId + ' div.questionDetails' ).empty();
        $( '#'+ question.uiId + ' div.additionalButtons' ).empty();

        var type = question.questionType.id;

        switch( +type ){
        case QuestionType.DESCRIPTIVE:
            $('.string').text(LOC.get(question.questionType.typeName));
            createDescriptive();
            break;
        case QuestionType.INTEGER:
            $('.int').text(LOC.get(question.questionType.typeName));
            createNumeric( false );
            break;
        case QuestionType.DECIMAL:
            $('.decimal').text(LOC.get(question.questionType.typeName));
            createNumeric( true );
            break;
        case QuestionType.DATE:
            $('.date').text(LOC.get(question.questionType.typeName));
            createDate();
            break;
        case QuestionType.IMAGE:
            $('.image').text(LOC.get(question.questionType.typeName));
            createImage();
            break;
        case QuestionType.TIME:
            $('.time').text(LOC.get(question.questionType.typeName));
            createTime();
            break;
        case QuestionType.GEOPOINT:
            $('.geopoint').text(LOC.get(question.questionType.typeName));
            createGeopoint();
            break;
        case QuestionType.EXCLUSIVE:
            $('.select1').text(LOC.get(question.questionType.typeName));
            createSelect( true );
            break;
        case QuestionType.CHOICE:
            $('.select').text(LOC.get(question.questionType.typeName));
            createSelect( false );     
            break;
        default:
        }

        if(question.defaultAnswer != null ){
            $( '#' + question.uiId + ' .defaultAnswer ').val( question.defaultAnswer.textData );
        }
        //TODO move to question function
        $( '#' + question.uiId + ' .defaultAnswer ').keyup( function(){onDefaultChanged()});

    }

    function setDefaultAnswer( newDefValue ){
        if(question.defaultAnswer == null){
            question.defaultAnswer = new DefaultAnswer();
        }
        question.defaultAnswer.textData = newDefValue;
    }

    function clearDefaultAnswer(){
        if(question.defaultAnswer != null){
            question.defaultAnswer.textData = '';
        }
    }

    function onDefaultChanged(){
        setDefaultAnswer( $( '#' + question.uiId + ' .defaultAnswer ').val() );
    }

    function createDescriptive(){
        var elem = $(
                '<div>'
            +   '<table><tr><td>'
            +   '<label class="detailLabel defaultLabel" for="descriptiveDefault">DEFAULT:</label><input class="detailInputText descriptiveDefault defaultAnswer" type="text" id="descriptiveDefault" name="descriptiveDefault" placeholder="Default Answer.." />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_LENGTH' ) + '</span><input class="descriptiveLength detailInputText" type="text" name="length" />'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</tr></td></table>'
            +   '</div>'
            );//TODO length can be only numeric

        $( '#'+ question.uiId + ' div.questionDetails' ).append( elem );
        $( '#'+ question.uiId + ' .descriptiveDefault' ).bind('click',false);
               
        $( '#'+ question.uiId + ' .descriptiveLength' ).val( question.constraintMax );
        $( '#'+ question.uiId + ' .descriptiveLength' ).bind('click',false);
        $( '#'+ question.uiId + ' .descriptiveLength' ).keyup( function (){onQuestionLengthChanged()});
        $( '#'+ question.uiId + ' .descriptiveLength' ).numeric( {decimal: false, negative: false} );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxRequiredChange();

    }


    function onQuestionLengthChanged(){
        var val = $( '#'+ question.uiId + ' .descriptiveLength').val();
        if( +val === 0 ){
            question.constraintMax = null;
            $( '#' + question.uiId + ' .descriptiveLength ').val( "" );
        }else{
            question.constraintMax = val;
        }
    }

    function createNumeric( allowDecimal ){
        var elem = $(
                '<div>'
            +   '<span class="detailLabel defaultLabel">DEFAULT:</span><input class="detailInputText numericDefault defaultAnswer" type="text" name="numericDefault" placeholder="" />'
            +   '<input class="rangeCheckMin" type="checkbox" name="minRangeCheckBox" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_MIN_RANGE' ) + '</span>'
            +   '<input class="rangeInputMin detailInputText" type="text" name="minRangeInput" />'

            +   '<input class="rangeCheckMax" type="checkbox" name="maxRangeCheckBox" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_MAX_RANGE' ) + '</span>'
            +   '<input class="rangeInputMax detailInputText" type="text" name="maxRange" />'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );
        
        $( '#'+ question.uiId + ' .numericDefault' ).bind('click',false);
        $( '#'+ question.uiId + ' .minRangeInput' ).bind('click',false);
        $( '#'+ question.uiId + ' .maxRange' ).bind('click',false);

        $( '#' + question.uiId + ' input.rangeCheckMin').change( function (){onCheckBoxMinChange();} );
        $( '#' + question.uiId + ' input.rangeCheckMax').change( function (){onCheckBoxMaxChange();} );

        $( '#' + question.uiId + ' .rangeInputMin').keyup( function (){onRangeInputMinChanged();} );
        $( '#' + question.uiId + ' .rangeInputMax').keyup( function (){onRangeInputMaxChanged();} );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );



        if( question.constraintMax != undefined &&  question.constraintMax != null && question.constraintMax != "" ){
            $( '#'+ question.uiId + ' .rangeInputMax' ).val( question.constraintMax );
            $( '#' + question.uiId + ' input.rangeCheckMax' ).attr( 'checked', true)
        }

        if( question.constraintMin != undefined &&  question.constraintMin != null && question.constraintMin != ""){
            $( '#'+ question.uiId + ' .rangeInputMin' ).val( question.constraintMin );
            $( '#' + question.uiId + ' input.rangeCheckMin' ).attr( 'checked', true);
        }

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxMinChange();
        onCheckBoxMaxChange();
        onCheckBoxRequiredChange();

        if( allowDecimal ) {
            $( '#' + question.uiId + ' .rangeInputMin, .rangeInputMax, .defaultAnswer').numeric();
        } else {
            $( '#' + question.uiId + ' .rangeInputMin, .rangeInputMax, .defaultAnswer').numeric( false );
        }
    }

    function onRangeInputMaxChanged(){
        question.constraintMax = $( '#'+ question.uiId + ' .rangeInputMax' ).val();
    }

    function onRangeInputMinChanged(){
        question.constraintMin = $( '#'+ question.uiId + ' .rangeInputMin' ).val();
    }


    function onCheckBoxMinChange(){

        var inputElem = $( '#' + question.uiId + ' input.rangeInputMin' );
        if( $( '#' + question.uiId + ' input.rangeCheckMin' ).is( ':checked' ) ){
            inputElem.removeAttr( 'disabled' );
        }else{
            inputElem.attr( 'disabled', 'disabled' );
            question.constraintMin = null;
        }
    }

    function onCheckBoxMaxChange(){
        var inputElem = $( '#' + question.uiId + ' input.rangeInputMax' );
        if( $( '#' + question.uiId + ' input.rangeCheckMax' ).is( ':checked' ) ){
            inputElem.removeAttr( 'disabled' );
        }else{
            inputElem.attr( 'disabled', 'disabled' );
            question.constraintMax = null;
        }
    }

    function onCheckBoxRequiredChange() {
        if( $( '#' + question.uiId + ' input.requiredCheck' ).is( ':checked' ) ){
            question.required = 1;
        } else {
            question.required = 0;
        }
    }

    function createDate(){
         var elem = $(
                '<div class="dateDefault">'
            +   '<span class="detailLabel defaultLabel">DEFAULT:</span><input class="defaultAnswer detailInputText dateInput" type="text" name="numericDefault" />'
            +   '</div>'
            +   '<div>'
            +   '<input class="rangeCheckMin" type="checkbox" name="minRangeCheckBox" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_MIN_RANGE' ) + '</span>'
            +   '<input class="dateInput rangeInputMin detailInputText" type="text" name="minRange" />'
            +   '<input class="rangeCheckMax" type="checkbox" name="maxRangeCheckBox" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_MAX_RANGE' ) + '</span>'
            +   '<input class="dateInput rangeInputMax detailInputText" type="text" name="maxRange" />'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );
        $( '#' + question.uiId + ' .defaultAnswer' ).datepicker({
                        showOn: "button",
                        buttonImage: "images/Calendar-icon.png",
                        buttonImageOnly: true,
                        changeMonth: true,
                        changeYear: true,
                        dateFormat: 'yy-mm-dd',
                        onClose: function(dateText, inst) {onDefaultChanged();}
        }).dateEntry( {dateFormat: 'ymd-', spinnerImage: ''} );

        $( '#' + question.uiId + ' .rangeInputMin' ).datepicker({
                        showOn: "button",
                        buttonImage: "images/Calendar-icon.png",
                        buttonImageOnly: true,
                        changeMonth: true,
                        changeYear: true,
                        dateFormat: 'yy-mm-dd',
                        onClose: function(dateText, inst) {onRangeInputMinChanged();}
        }).dateEntry( {dateFormat: 'ymd-', spinnerImage: ''} );

        $( '#' + question.uiId + ' .rangeInputMax' ).datepicker({
                    showOn: "button",
                    buttonImage: "images/Calendar-icon.png",
                    buttonImageOnly: true,
                    changeMonth: true,
                    changeYear: true,
                    dateFormat: 'yy-mm-dd',
                    onClose: function(dateText, inst) {onRangeInputMaxChanged();}
        }).dateEntry( {dateFormat: 'ymd-', spinnerImage: ''} );

        $( '#' + question.uiId + ' input.rangeCheckMin').change( function (){onCheckBoxMinChange();} );
        $( '#' + question.uiId + ' input.rangeCheckMax').change( function (){onCheckBoxMaxChange();} );
        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.constraintMax != undefined &&  question.constraintMax != null && question.constraintMax != "" ){
            $( '#'+ question.uiId + ' .rangeInputMax' ).val( question.constraintMax );
            $( '#' + question.uiId + ' input.rangeCheckMax' ).attr( 'checked', true)
        }

        if( question.constraintMin != undefined &&  question.constraintMin != null && question.constraintMin != ""){
            $( '#'+ question.uiId + ' .rangeInputMin' ).val( question.constraintMin );
            $( '#' + question.uiId + ' input.rangeCheckMin' ).attr( 'checked', true);
        }

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxMinChange();
        onCheckBoxMaxChange();
        onCheckBoxRequiredChange();

        $( '#' + question.uiId + ' .rangeInputMin').keyup( function (){onRangeInputMinChanged();} );
        $( '#' + question.uiId + ' .rangeInputMax').keyup( function (){onRangeInputMaxChanged();} );
    }

    function createImage(){
//        return $( '<span>Image element<span>' );
        var elem = $(
               '<div class="imageRequired">'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxRequiredChange();
    }

    function createTime(){
         var elem = $(
               '<div class="timeDefault">'
            +   '<span class="detailLabel defaultLabel">DEFAULT:</span>'
            +   '<input class="defaultAnswer detailInputText timeInput" type="text" name="numericDefault" placeholder="0:0:0" />'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );
        $( '#'+ question.uiId + ' .timeInput' ).bind('click',false);
        $( '#' + question.uiId + ' .timeInput' ).timeEntry({
                                                spinnerImage: '',
                                                showSeconds: true,
                                                show24Hours: true
                                            });



        $( '#' + question.uiId + ' .timeInput' ).val( );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxRequiredChange();
    }

    function createGeopoint(){
//        return $( '<span>Image element<span>' );
        var elem = $(
               '<div class="geopointRequired">'
            +   '<input class="requiredCheck" type="checkbox" name="required" />'
            +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxRequiredChange();
    }

    function createSelect( isExclusive ){

        $( '#'+ question.uiId + ' div.additionalButtons' ).append(
                    '<div class="importOption"></div>'
                +   '<div class="addOption" ></div>'
                +   '<div style="float:right; margin-top: 10px;">'
                +   '<input class="requiredCheck" type="checkbox" name="required" />'
                +   '<span class="detailLabel">' + LOC.get( 'LOC_REQUIRED' ) + '</span>'
                +   '</div>'
        );

        var elem = $(
                '<div class="options">'
            +   '</div>'
            );

        $( '#' + question.uiId + ' div.questionDetails' ).append( elem );
        $( '#' + question.uiId + ' div.addOption').bind('click', +isExclusive, function( event ) {onAddOptionClicked( event );} );
        $( '#' + question.uiId + ' div.importOption').bind('click',  function( event ) {loadOptionsFromFile();} );

        $( '#' + question.uiId + ' input.requiredCheck').change( function (){onCheckBoxRequiredChange();} );

        if( question.required != undefined &&  question.required != null && question.required != "" ){
            $( '#' + question.uiId + ' input.requiredCheck' ).attr( 'checked', true);
        }

        onCheckBoxRequiredChange();

        if( question.questionOptionCollection.length == 0 ){
            var option = new QuestionOption();
            question.questionOptionCollection.push( option );
        }

        $.each( question.questionOptionCollection, function( i, item ){
            if( !item.hasOwnProperty( 'isDelete' ) ){
                appendOption( item, isExclusive );
            }
        });
    }

    function loadCSVFile(data) {
        var file = data.files[0];

        if (file) {
            var r = new FileReader();
            r.onload = function(e) {
            var contents = e.target.result;
                var importFileLines = contents.split( /(.*?)[\r\n]/ );
                $.each( importFileLines, function( i, item ) {
                    szData = item;
                    if ( szData.charCodeAt(0) == 34 ) {
                        szChoice = szData.substr(1,szData.length-2);
                    } else if ( szData == "" ) {
                        return;
                    } else {
                        szChoice = szData;
                    }

                    var option = new QuestionOption();
                    option.label = szChoice;
                    option.optionValue = szChoice.replace(/[^a-z0-9]/ig,"").toLowerCase().split(' ').join('');
                    question.questionOptionCollection.push( option );
                    appendOption( option, question.questionType.id == QuestionType.EXCLUSIVE );
                });
            }
            r.readAsText(file);
        } else {
            alert("Failed to load file");
        }
        uploadDialog.dialog("close");
    }

    function loadOptionsFromFile() {
        if ( window.File && window.FileReader && window.FileList) {
            $('#buttonSendFile').unbind( 'click' );
            $('#buttonSendFile').click( function() {loadCSVFile( document.getElementById('uploadSurveyInput') );});

            $('#uploadSurveyFormButton').text(LOC.get('LOC_SEARCH'));
            $('#uploadSurveyInput').unbind('change');
            $('#uploadSurveyInput').change( function() {
                $('#uploadSurveyFakeInput').text($(this).val())
             } );

            uploadDialog.dialog( {title: LOC.get('LOC_CSV_FILE_UPLOAD')});
            $('#dialog-upload-query').text(LOC.get('LOC_CHOOSE_CSV_FILE_UPLOAD'));
            $('#buttonSendFile').text(LOC.get('LOC_LOAD'));

            uploadDialog.dialog({close: function(){$.unblockUI();}} )
            uploadDialog.dialog("open");
            $.blockUI( {message: null} );

        } else {
            alert('HTML5 support is needed to use this functionality. The File APIs are not fully supported in this browser.');
        }
    }

    function onSelectChanged( questionUiId ){
        var defValue = '';
        var value = $("#" + question.uiId + ' input[@name=' + questionUiId + ']:checked');
        $.each( value, function (idx, item){
            defValue += $(this).val() + ' ';
        });

        setDefaultAnswer( defValue )
    }

    function appendOption( option, isExclusive ){
        var optionId;
        if( option.hasOwnProperty( 'id' ) ){
            optionId = 'option' + option.id;
        }else{
            var numRand = Math.floor( Math.random() * 10000 ); //TODO maybe exist better way to get random id
            optionId = 'option' + numRand;
        }
        option.uiId = optionId;

        var optionType;
        if( isExclusive ){
            optionType = 'radio';
        }else{
            optionType = 'checkbox';
        }

        var labelId = optionId + 'label';

        $( '#' + question.uiId + ' div.options' ).append(
                    '<div id="' + optionId + '" class="optionInput">'
                +   '<input name="' + question.uiId + '" value="' + option.optionValue + '" type="' + optionType + '" class="optionCheckBox" />'
                +   '<span id="' + labelId + '" class="detailLabel optionLabel">' + option.label + '</span>'
                +   '<div class="skipto optionIcon"></div>'
                +   '<div class="deleteOption optionIcon"></div>'
                +   '</div>'
            );

        if( !isExclusive ){
            $( '#' + question.uiId + ' .skipto' ).hide();
        }else{
            $( '#' + question.uiId + ' .skipto' ).draggable({
                refreshPositions: true,
                    start: function(){
                        $( '#' + optionId.uiId + ' .optionIcon' ).addClass( 'iconVisibleDrag' );
                         Editor.setHoverConfig();
                    },
                    stop: function(){
                        $( '#' + optionId.uiId + ' .optionIcon' ).removeClass( 'iconVisibleDrag' );
                        $( '#' + optionId.uiId + ' .optionIcon' ).removeClass( 'iconVisible' );
                        Editor.removeHoverConfig();
                    },
                    revert: 'invalid',
                    helper: function(event) {
                    var dragging = $('<div class="optionIcon skipto" style="visibility:visible" ></div>');
                return dragging;
                }
                });
        }

        if( question.defaultAnswer != null &&
            question.defaultAnswer.textData.indexOf( option.optionValue ) != -1 ){
            $( '#' + optionId + ' input').attr('checked', 'checked' );
        }

        new EditedLabel( $( "#" + labelId ), function( newLabel ){
            onOptionLabelChanged( optionId, newLabel );});

        $( '#' + optionId + ' .deleteOption' ).click( optionId, function( optId ){deleteOption( optId.data );});
        $( '#' + optionId  ).hover(
            function(){
                $( '#' + optionId + ' .optionIcon' ).addClass( 'iconVisible' );
            },
            function(){
                $( '#' + optionId + ' .optionIcon' ).removeClass( 'iconVisible' );
            }
        );

        $( '#' + optionId ).unbind( 'change' );
        $( '#' + optionId ).change( question.uiId, function( event ){onSelectChanged( event.data )} );
    }

    function onAddOptionClicked( event ){
        var option = new QuestionOption();
        question.questionOptionCollection.push( option );
        appendOption( option, event.data );
    }

    function deleteOption( optId ){
        if( getOptionCount() <= 1 ){
            Editor.getSkipLogicController().optionDeleted(optId);
            $( '#'+ optId + ' .skipto').removeClass('selected');
            alert( LOC.get( 'LOC_WARN_DELETE_OPTION' ) );
            return;
        }

        var option = getOption( optId );
        option.isDelete = 'true';

        Editor.getSkipLogicController().optionDeleted(optId);
        $( '#'+ optId ).remove();
    }

    function getOptionCount(){
        var count = 0;
        $.each( question.questionOptionCollection , function( idx, item ){
            if( !item.hasOwnProperty( 'isDelete' ) ){
                count++;
            }
        });
        return count;
    }

    function onOptionLabelChanged( optionId, newLabel ){
        var option = getOption( optionId );
        var optionVal = newLabel.replace(/[^a-z0-9]/ig,"").toLowerCase().split(' ').join('');

        $( '#'+ optionId + ' input' ).attr('value', optionVal );

        option.label = newLabel;
        option.optionValue = optionVal;
    }

    function onQuestionTypeChanged(){
        question.constraintMax = null;
        question.constraintMin = null;
        clearDefaultAnswer();

        var type = +question.questionType.id;

        if(  type != QuestionType.CHOICE && type != QuestionType.EXCLUSIVE ){
            question.questionOptionCollection = [];
        }

        appendDetails();
    }

    function getOption( optionUiId ){// TODO move to model
        var option;

        $.each( question.questionOptionCollection , function( idx, item ){
            if( item.uiId == optionUiId ){
                option = item;
                option.index = idx;
            }
        });
        return option;
    }
}
