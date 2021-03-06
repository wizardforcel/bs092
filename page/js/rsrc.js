$(function() {
    
    var getRsrc = function() {
        
        $('#modal-loading').modal('show');
        var proj = localStorage.getItem('proj');
        var token = localStorage.getItem('token');
        $('#proj-name').text(proj);
        
        var user = getUser();
        var url = getUrl() + "/System/Resource/list?userid=" + user.id + "&project=" + token + '/' + proj;
        $.ajax({
            type: "GET", 
            url: url, 
            dataType: "xml",
            beforeSend: function (request) {
                request.setRequestHeader("passwd", user.pw);
            }
        }).done(function(data){
            var $data = $(data);
            var errmsg = $data.find("error").text();
            if (errmsg.length !== 0)
                alert(errmsg);
            else
                loadRsrc($(data).find("resource"));
            $('#modal-loading').modal('hide');
        }).fail(function(data, status, e){
            alert("network error");
            $('#modal-loading').modal('hide');
        });
    };
    
    var loadRsrc = function($list) {
        $('.rsrc-row').remove();
        for(var i = 0; i < $list.length; i++)
        {
            var $item = $list.eq(i);
            var name = $item.children('name').text();
            var status = $item.children('state').text();
            status = (status == 'loaded')? '√': '×';
            var lastModified = $item.children('lastmodified').text();
            
            var $tr = $('<tr class="rsrc-row"></tr>');
            var $nameTd = $('<td class="rsrc-name">' + name + '</td>');
            var $statusTd = $('<td>' + status + '</td>');
            var $lastTd = $('<td>' + lastModified + '</td>');
            var $opTd = $('<td></td>');
            var $viewAnchor = $('<a href="#" class="rsrc-view">查看</a>');
            var $mineAnchor = $('<a href="#" class="rsrc-mine">挖掘</a>');
            $opTd.append($viewAnchor);
            $opTd.append(' ');
            $opTd.append($mineAnchor);
            $tr.append($nameTd);
            $tr.append($statusTd);
            $tr.append($lastTd);
            $tr.append($opTd);
            $('#rsrc-table').append($tr);
        }
        $('.rsrc-view').click(viewRsrc);
        $('.rsrc-mine').click(mineRsrc);
    };
    
    
    var viewRsrc = function() {
        event.preventDefault()
        var token = localStorage.getItem('token');
        var proj = localStorage.getItem('proj');
        var rsrc = $(this).parent().parent().children('.rsrc-name').text();
        window.open(getUrl() + '/Entity/' + token + '/' + proj + '/' + rsrc + '/')
    };
    
    var mineRsrc = function() {
        event.preventDefault()
        var rsrc = $(this).parent().parent().children('.rsrc-name').text();
        localStorage.setItem('rsrc', rsrc);
        location.href = './mining.html';
    };
    
    getRsrc();
});