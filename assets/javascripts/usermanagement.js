/*
 * File encapsulates action related to User List view
 *
 **/


var UserManagement = function() {

    var searchLabels;
    var searchIds;
    var searchDbFields = ["username", "email", "phoneNumber"];
    var searchBy = "username";

    var contentUrl;
    var lastSortByColumn;
    var lastSortAscending = true;
    var elementStartIndex = 0;
    var elementEndIndex = 10;
    var totalItems;

    var scrollReady = true;

    var selectedGroupName = "";

    return {
        showUserManagement : function(){showUserManagement();},
        fillWithData : function(i, item){fillWithData(i, item);},
        searchFieldChange: function(event){searchFieldChange(event);},
        getSearchBy: function() {return searchBy;},
        refresh: function() {refresh();},
        loadingFinished: function() {loadingFinished();},
        prepareLayout: function(tableHtml){prepareLayout(tableHtml);},
        loadUsers: function() {loadUsers();},
        additionalAjaxParams: function() {return additionalAjaxParams();}
    };

    function showUserManagement (){
        elementEndIndex = 10;
        scrollReady = true;

        initLayout();

        $('#minimalist_layout2_2').empty();
        $('#leftColumnContent' ).empty();
        $('#plusButton').unbind('mouseover');
        $('#userManagement').unbind('click');
        $('#searchComboBox').unbind('click');
        $('#searchComboText').empty();
        $('#searchTextField').val("");


        $('#container').height('715px');
        $('#contentMain').append('<div id=contentToolbar></div>');
        $('#contentToolbar').addClass('userManagement');

        loadGroups();

        //$('#plusButton').click( function(eventObject) {ContextComboBox.showUserManagementMenu(eventObject);});

        $('#userManagement').text( LOC.get('LOC_SURVEY_LIST') );
        $('#sectionTitle').text( LOC.get('LOC_USER_ADMIN') );

        $('#userManagement').click(function() {SurveyList.showSurveyList();});

        $('#searchComboBox').click( function(event) {createSearchList(event);});
        $('#searchComboText').text(LOC.get( "LOC_NAME" ));

        $(window).scroll(function(){
            if  ($(window).scrollTop() == $(document).height() - $(window).height()){
                scrollDownList();
            }
        });

        $('#leftColumn_layout2' ).click( function(event) {clearFilter(event);});
    }

    function prepareLayout(tableHtml) {
        $('#minimalist_layout2_2').empty();
        $('#minimalist_layout2_2').append(tableHtml);
    }

    function loadGroups() {
        var htmlContent = '';
        htmlContent += '<thead>' + '<tr>';

        htmlContent += '<th scope="col" id="' + "executeSortByGroup" + '" ';
        htmlContent +='class = "sortHeader2 columnHeaderNoWrap ' + "executeSortByGroup" + 'Width"';
        htmlContent += '><div>';
        htmlContent += LOC.get( 'LOC_GROUP' );
        htmlContent +='<span class="sortIndicatorPlaceholder"/></div></th>';
        htmlContent +='<th></th>';

        htmlContent += '</thead>'
                     + '<tbody id="dynamicGroupListTable">'
                     + '</tbody>';
        $("#minimalist_layout2").append(htmlContent);
        $('.sortHeader2' ).click( function(event){toggleSortByColumn(event);} );

        contentUrl = 'listData/' + 'groups';

        fillListGroupData( lastSortByColumn, true );
    }

    function fillListGroupData( orderByColumn, isAscending ) {

        lastSortByColumn = orderByColumn;
        var params = {'startIndex': elementStartIndex,
                      'endIndex' : elementEndIndex,
                      'isAscending': isAscending,
                      'orderBy': orderByColumn
                     };

        if( selectedGroupName != null && selectedGroupName.length > 0 ) {
           jQuery.extend(params, additionalAjaxParams());
        }

        var getJSONQuery = $.getJSON( contentUrl, params, function(data){refreshGroupTable(data);} );
        getJSONQuery.error(Utils.redirectIfUnauthorized);
    }

    function refreshGroupTable(data) {
        totalItems = data.totalSize;
        if($('#container').height() < elementEndIndex * 45 + 280){
            $('#container').height(elementEndIndex * 45 + 295)
        }
        $('#dynamicGroupListTable').empty();
        $.each(data.items,function(i,item) {

            fillGroupWithData(i,item);

            $( '#dynamicGroupRow' + i ).mouseover( i, function(i) {onMouseOverHandler(i);} );
            $( '#dynamicGroupRow' + i ).mouseout( i, function(i) {onMouseOutHandler(i);} );
            $( '#dynamicGroupRow' + i).click( {index: i}, function(event){onGroupClicked(event);} );
            $( '#dynamicGroupRow' + i + ' .groupDelete').click( {index: i}, function(event){
                                                                                onDeleteGroupClicked(event);} );
        });

        if( selectedGroupName != null && selectedGroupName.length > 0 ) {
            $.each( $("[id^=dynamicGroupRow]"), function( i, item ){selectGroup( i, item );});
        }

        $('#contentToolbar2').empty();
        $('#contentToolbar2').unbind('click');
        if(elementEndIndex < totalItems){
            $('#contentToolbar2').removeClass('backgroundHide');
            scrollDownList();
            
            //$('#contentToolbar2').append('<span class="toolbarText">' + LOC.get( 'LOC_EXPAND_ITEM_LIST' ) + '</span>');
            //$('#contentToolbar2').click(function() {
            //$('#contentToolbar2').unbind('click');
          //     scrollDownList();
             //   }); 
        //} else {
         //   $('#contentToolbar2').addClass('backgroundHide');
        }
        //$('#contentToolbar2').animate({top: $('#dynamicGroupListTable').position().top + $('#dynamicGroupListTable').height()});
        if(scrollReady) {
            loadUsers();
        }
        loadingFinished();
        scrollReady = true;
    }

    function onDeleteGroupClicked( event ){
        var groupName = $( '#dynamicGroupRow' + event.data.index )[0].firstChild.id;

        $( '#dynamicGroupRow' + event.data.index ).remove();
        $.ajax({url: 'userManager/deleteGroup',
                        data: {groupname: groupName},
                        error: function(data, textStatus, jqXHR){
                                if(!Utils.redirectIfUnauthorized(data, textStatus, jqXHR)){
                                    alert("error");
                                }},
                        success: function(data, textStatus, jqXHR){
                            selectedGroupName = null;
                            UserManagement.refresh();
                        }
        });
    }

    function selectGroup(i, item) {
        if ( selectedGroupName == item.firstChild.id ) {
            $( '#dynamicGroupRow' + i ).addClass( "selectedGroup" );
        }
    }

    function loadUsers() {
        var columnIds = ["executeSortByUsername", "executeSortByEmail", "executeSortByPhone", "executeSortByPermission","itemToolbarColumnId"];
        var columnTexts = ["LOC_USERNAME", "LOC_EMAIL", "LOC_PHONE", "LOC_PERMISSION",""];
        var columnDbFields = ["username", "email", "phoneNumber", "userRoleCollection", null];

        DynamicTable.showList(columnIds, columnTexts, columnDbFields, "users", UserManagement);
    }

    function additionalAjaxParams() {
        if ( selectedGroupName != null && selectedGroupName.length > 0 ) {
            return {'groupName': selectedGroupName};
        } else {
            return null;
        }
    }

    function loadingFinished() {
        $( "#minimalist_layout2_2 tr" ).draggable({
            helper: function(event) {
                var dragging = $('<div class="drag-row"><table></table></div>')
                    .find('table').append($(event.target).closest('tr').clone()).end();
                dragging.addClass('draggingElement');
                return dragging;
            },
            appendTo: 'body'
        });

        $( "#plusButton" ).draggable({
            helper: 'clone',
            appendTo: 'body'
        });

        $( "#minimalist_layout2 tr" ).droppable({
            drop: function(event, ui) {
                if( ui.draggable.hasClass("plusButton_layout2") ) {
                    var groupItem = $('#minimalist_layout2');
                    var rectGroup = new Object();
                    rectGroup.top = groupItem.position().top;
                    rectGroup.left = groupItem.position().left;
                    rectGroup.width = groupItem.width();
                    rectGroup.height = 49;
                    if(!NewGroupTable.isShown()) {
                        NewGroupTable.show(rectGroup);
                    }
                } else if ( ui.draggable.hasClass("addableToUserList") ) {
                    var sourceUserId = ui.draggable.context.attributes['userId'].value;
                    var targetGroupName = event.target.attributes['groupName'].value;
                    $.ajax({url: 'userManager/addUserToGroup',
                            data: {username: sourceUserId, groupname: targetGroupName},
                            error: function(data, textStatus, jqXHR){
                                    if(!Utils.redirectIfUnauthorized(data, textStatus, jqXHR)){
                                        alert("error");
                                    }}
                                 ,
                            success: function(data, textStatus, jqXHR){UserManagement.refresh();}
                    });
                }
            },
            accept: function(d) {
                if(d.hasClass("plusButton_layout2") || d.hasClass("addableToUserList")){
                    return true;
                } else {
                    return false;
                }
            }
        });

        $( "#minimalist_layout2_2 tr" ).droppable({
            drop: function(event, ui) {
                    var groupItem = $('#minimalist_layout2_2');
                    var rectGroup = new Object();
                    rectGroup.top = groupItem.position().top;
                    rectGroup.left = groupItem.position().left + 14;
                    rectGroup.width = groupItem.width();
                    rectGroup.height = 49;
                    if(!NewUserTable.isShown()) {
                        NewUserTable.show(rectGroup);
                    }
            },
            accept: $("#plusButton").selector
        });
    }

    function initLayout() {
        $('#leftColumn').remove();
        $('#content').remove();

        var layout = "";
        layout += "<div id='leftColumn_layout2' title='" + LOC.get('LOC_CLICK_TO_DISABLE_SELECTED_GROUP') + "'>"
                + "<div class='plusButton_layout2 clickableElem' id='plusButton'><div id ='plusButtonImageDrag'></div></div>"
                + "</div>"
        layout += "<div id='middleColumn_layout2'>"
                +   "<table id='minimalist_layout2'></table>"
                  + "<div id='contentToolbar2' ></div>"
                + "</div>"
        layout += "<div id='rightColumn_layout2'>"
                +   "<div id='contentMain'>"
                +       "<div id='datatable'>"
                +           "<table id='minimalist_layout2_2'></table>"
                +       "</div>"
                +   "</div>"
                + "</div>"

        $( '#container' ).append( layout );
    }

    function createSearchList(event) {
       searchLabels = [LOC.get("LOC_NAME"), LOC.get("LOC_EMAIL"), LOC.get("LOC_PHONE")];
       searchIds = ["searchByName", "searchByEmail", "searchByPhone"];
       ContextComboBox.showSearchMenu(event, searchLabels, searchIds, UserManagement);
    }


    function fillGroupWithData(i,item) {
         var total = 11; 
         if (item.groupName.length > 12){
                 var groupNameDisplay = item.groupName.substring(0,total) + '..';
                                     }else{
                 var groupNameDisplay = item.groupName;
                                     }
   
        $('#dynamicGroupListTable').append( '<tr groupName="' + item.groupName + '" id="dynamicGroupRow'+ i + '">'
                                    + '<td id="' + item.groupName + '" class="clickableElem"><p class="tableEntryGroupName">'+ groupNameDisplay + '</p>'
                                    + '<p class="tableEntryQuantity">('+ item.userCollection + ' ' + LOC.get('LOC_USERS') + ')</p>'
                                    + '</td>'
                                    + '<td class="menubar" id="menuGroup' + i + '" >'
                                    + '<div class="groupDelete" ><span title="' + LOC.get('LOC_SEND') + '"class="buttonPhone" id="buttonPhone" unselectable="on"></span><div>'
                                    + '<span title="' + LOC.get('LOC_DELETE') + '" class="buttonDelete" id="buttonDelete" unselectable="on"></span>'
                                    + '</td>'
                                    + '</tr>' );

        $('#menuGroup' + i +' #buttonPhone').click( {index: i,
                                                  groupName: item.groupName,
                                                  userCollection: item.userCollection},
        function(i){onPhoneGroupClicked(i);} );
    }

    function onPhoneGroupClicked(event) {
        event.stopPropagation();
        SendSMS.showSendGroupSMS(event.data);
        sendGroupSMSDialog.dialog( {title: LOC.get('LOC_SEND_SMS')} );
        $('#buttonSendGroupSMSDone').text( LOC.get('LOC_SEND') );
        sendGroupSMSDialog.dialog("open");
        
     }

    function fillWithData(i, item) {
        var total = 10; 

        if (item.email.length > 12){
                 var email = item.email.substring(0,total) + '..';
                                     }else{
                 var email = item.email;
                                     }
        if (item.phoneNumber.length > 12){
                 var phone = item.phoneNumber.substring(0,total) + '..';
                                     }else{
                 var phone = item.phoneNumber;
                                     }

        $('#dynamicListTable').append( '<tr class="addableToUserList" id="dynamicRow'+ i + '" userId="' + item.id + '">'
                                    + '<td><p style="overflow:hidden;word-wrap:break-word;" class="tableEntryUsername">'+ item.username + '</p>'
                                    +     '<p style="overflow:hidden;word-wrap:break-word;" class="tableEntryFirstLastName">'+ item.firstName + '<br>' + item.lastName + '</p></td>'
                                    + '<td>' + email + '</td>'
                                    + '<td>' + phone + '</td>'
                                    + '<td>' + item.userRoleCollection[0].ndgRole.roleName + '</td>'
                                    + '<td class="menubar" id="menu' + i + '" >'
                                    + '<span title="' + LOC.get('LOC_SEND') + '"class="buttonPhone" id="buttonPhone" unselectable="on"></span>'
                                    + '<span title="' + LOC.get('LOC_EDIT') + '" class="buttonEdit" id="buttonEdit" unselectable="on"></span>'
                                    + '<span title="' + LOC.get('LOC_DELETE') + '" class="buttonDelete" id="buttonDelete" unselectable="on"></span>'
                                    + '</td>'
                                    + '</tr>' );

         $('#menu' + i +' #buttonDelete').click( {index: i, id: item.id}, function(event){onDeleteUserClicked(event);} );
         $('#menu' + i +' #buttonEdit').click( {index: i, id: item.id}, function(event){onEditUserClicked(event, item);} );
         $('#menu' + i +' #buttonPhone').click( {index: i,
                                                  fullName: item.firstName + " " + item.lastName,
                                                  phoneNumber: item.phoneNumber},
         function(i){onPhoneUserClicked(i);} );
     }

    function toggleSortByColumn(event) {
        var columnId = 'executeSortByGroup';
        $('#' + columnId + ' span').removeClass('sortAscending');
        $('#' + columnId + ' span').removeClass('sortDescending');
        if ( lastSortAscending ) {
            $('#' + columnId + ' span' ).addClass('sortDescending');
            lastSortAscending = false;
        } else {
            $('#' + columnId + ' span' ).addClass('sortAscending');
            lastSortAscending = true
        }
        fillListGroupData( 'groupName', lastSortAscending );
    }

    function onDeleteUserClicked(event) {
         if ( ConfirmCover.isShown() ) {
             ConfirmCover.close();
         }
         var currentRow = $('#dynamicRow' + event.data.index);
         var rect = new Object();
         rect.top = currentRow.position().top;
         rect.left = currentRow.position().left;
         rect.width = currentRow.width() - $('#buttonDelete').width();
         rect.height = currentRow.height();
         ConfirmCover.show(rect, event.data.id);
     }

    function onEditUserClicked(event, item) {
        var groupItem = $('#minimalist_layout2_2');
        var rectGroup = new Object();

        rectGroup.top = groupItem.position().top;
        rectGroup.left = groupItem.position().left + 14;
        rectGroup.width = groupItem.width();
        rectGroup.height = 49;

        if(!EditUserTable.isShown()) {
           EditUserTable.show(rectGroup, item);
        }
     }

     function onPhoneUserClicked(event) {
        SendSMS.showSendUserSMS(event.data);
        sendUserSMSDialog.dialog( {title: LOC.get('LOC_SEND_SMS')} );
        $('#buttonSendSMSDone').text( LOC.get('LOC_SEND') );
        sendUserSMSDialog.dialog("open");
     }

    function refresh() {
        fillListGroupData( 'groupName', lastSortAscending );
    }

    function searchFieldChange(event) {
        var fieldId = event.currentTarget.id;
        var nameIndex = jQuery.inArray( fieldId, searchIds );
        $('#searchComboText').text(searchLabels[nameIndex]);
        searchBy = searchDbFields[nameIndex];
        $('#searchTextField').val("");
    }

    function onMouseOverHandler(e){
        $('#dynamicGroupRow'+ e.data + " span").addClass("hover");
    }

    function onMouseOutHandler(e){
        $('#dynamicGroupRow'+ e.data + " span").removeClass("hover");
    }

    function onGroupClicked(event) {
        $('#dynamicGroupRow'+ event.data.index).removeClass("hoverRow");

        if( $( '#dynamicGroupRow' + event.data.index ).hasClass( "selectedGroup" ) ) {
            $( '#dynamicGroupRow' + event.data.index ).removeClass( "selectedGroup" )
            $( '#dynamicGroupRow'+ event.data.index ).addClass("hoverRow");
            selectedGroupName = "";
        } else {
            $.each( $("[id^=dynamicGroupRow]"), function(i,item) {removeGroupSelection(i, item);});
            $( '#dynamicGroupRow' + event.data.index ).addClass( "selectedGroup" );
            selectedGroupName = $( '#dynamicGroupRow' + event.data.index )[0].firstChild.id;
        }
        loadUsers();
    }

    function clearFilter( event ) {
        $.each( $("[id^=dynamicGroupRow]" ), function( i, item ){removeGroupSelection( i, item );} );
        if ( selectedGroupName != "" ) {
            selectedGroupName="";
            loadUsers();
        }
    }

    function removeGroupSelection(i, item ) {
        if( item.classList != null ) {
            if( item.classList.contains("selectedGroup") ) {
                item.classList.remove("selectedGroup");
            }
        } else {/*This part is for IE. IE does not support 'classList' property*/
            var classes = item.className.split(' ');
            if( jQuery.inArray( "selectedGroup", classes ) >=0 ) {
                classes.splice(jQuery.inArray( "selectedGroup", classes ), 1);
                newClassesList = classes.toString();
                item.className = newClassesList;
            }
        }
    }

    function scrollDownList() {
        if(scrollReady) {
            $('#contentToolbar2 span').text( LOC.get('LOC_LOADING') );
            scrollReady = false;
            var diff = totalItems - elementEndIndex;
            if( diff > 0 ){
                if(diff > 5){
                    elementEndIndex += 5;
                } else{
                    elementEndIndex += diff;
                }
            UserManagement.refresh();
            }
        }
    }
}();
