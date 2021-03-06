$(function(){
    
    var selected = {};
    
    
    var getCols = function() {
        
        $('#modal-loading').modal('show');
        var user = getUser();
        var proj = localStorage.getItem('proj');
        var token = localStorage.getItem('token');
        var rsrc = localStorage.getItem('rsrc');
        $('#rsrc-name').text(rsrc);
        
        var url = getUrl() + '/System/Resource?userid=' + user.id + '&project=' + 
            token + '/' + proj + '&resource=' + rsrc
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
                loadCols($(data).find("Column"));
            $('#modal-loading').modal('hide');
        }).fail(function(data, status, e){
            alert("network error");
            $('#modal-loading').modal('hide');
        });
    };
    
    var loadCols = function($list) {
        $('.cols-row').remove();
        for(var i = 0; i < $list.length; i++)
        {
            var $item = $list.eq(i);
            var name = $item.children('ColumnName').text();
            var alias = $item.children('AttributeName').text() || "（未设置）";
            var size = $item.children('Size').text();
            //var isNotNull = $item.children('NotNull').text();
            var type = $item.children('Type').text();
            if(size) type += ' * ' + size;
            
            var $tr = $('<tr class="cols-row"></tr>');
            var $nameTd = $('<td class="cols-name">' + name + '</td>');
            var $aliasTd = $('<td>' + alias + '</td>');
            var $typeTd = $('<td>' + type + '</td>');
            var $isNotNullTd = $('<td>是</td>');
            var $opTd = $('<td></td>');
            var $selectCheck = $('<input type="checkbox" class="cols-select" />');
            $opTd.append($selectCheck);
            $tr.append($nameTd);
            $tr.append($aliasTd);
            $tr.append($typeTd);
            $tr.append($isNotNullTd);
            $tr.append($opTd);
            $('#cols-table').append($tr);
        }
        $('.cols-select').click(selectCol);
    };
    
    var selectCol = function() {
        
        var $this = $(this);        
        var name = $this.parent().parent().children('.cols-name').text();
        
        if($this.is(':checked'))
            selected[name] = name;
        else
            delete selected[name];
        
        console.log(selected);
    };
    
    var mining = function() {
        
        var uid = localStorage['id'];
        var proj = localStorage.getItem('proj');
        var token = localStorage.getItem('token');
        var rsrc = localStorage.getItem('rsrc');
        
        var type = $('#type-combo').val();
        var algo = $('#algo-combo').val();
        var start = $('#start-num').val();
        var count = $('#count-num').val();
        if(count == "-1") count = "";

        var title = $('#title-txt').val();
        if(title == "")
        {
            alert('名称不能为空！');
            return;
        }
        
        var cols = keys(selected);
        if(cols.length == 0)
        {
            alert('请选择要挖掘的列！');
            return;
        }
        cols = JSON.stringify(cols);
        
        var args = {}
        if(algo == "apriori") {
            var minSupport = $('#apriori-min-support').val();
            var minConf = $('#apriori-min-conf').val();
            minSupport = parseFloat(minSupport);
            minConf = parseFloat(minConf);
            if(isNaN(minSupport) || isNaN(minConf)) {
                alert('参数格式有误！');
                return;
            }
            args = {
                minSupport: minSupport,
                minConf: minConf
            }
        }
        else if(algo == "kmeans") {
            var n_clusters = parseInt($('#kmeans-label-num').val());
            var max_iter = parseInt($('#kmeans-max-iter').val());
            var init = $('#kmeans-init').val();
            var precompute_distances = $('#kmeans-pre-dist').val();
            if(precompute_distances != 'auto') precompute_distances = precompute_distances == 'true'
            tol = parseFloat($('#kmeans-tol').val());
            if(isNaN(n_clusters) || isNaN(max_iter) || 
                ['k-means++', 'random'].indexOf(init) == -1 ||
                ['auto', true, false].indexOf(precompute_distances) == -1 ||
                isNaN(tol)) {
                alert('参数格式有误！');
                return;
            }
            args = {
                n_clusters: n_clusters,
                max_iter: max_iter,
                init: init,
                precompute_distances: precompute_distances,
                tol: tol
            };
        }
        else if(algo == "kmedoids") {
            var k = $('#kmedoids-label-num').val();
            k = parseInt(k);
            if(isNaN(k)) {
                alert('参数格式有误！');
                return;
            }
            args = {
                k: k
            };
        }
        else if (algo == "svm") {
            var C = parseFloat($('#svm-c').val());
            var kernel = $('#svm-kernel').val();
            var degree = parseInt($('#svm-degree').val());
            var gamma = $('#svm-gamma').val();
            if(gamma != 'auto') gamma = parseFloat(gamma);
            var coef0 = parseFloat($('#svm-coef0').val());
            var probability = $('#svm-probability').val() == 'true';
            var shrinking = $('#svm-shrinking').val() == 'true';
            var tol = parseFloat($('#svm-tol').val());
            if(isNaN(C) || isNaN(degree) || (gamma != 'auto' && isNaN(gamma)) || 
                isNaN(coef0) || isNaN(tol)) {
                alert('参数格式有误！');
                return;
            }
            args = {
                C: C,
                kernel: kernel,
                degree: degree,
                gamma: gamma,
                coef0: coef0,
                probability: probability,
                shrinking: shrinking,
                tol: tol
            }
            console.log(args);
        }
        args = JSON.stringify(args);
        
        var url = './mining/' + uid + '/' + token + '/' + proj + '/' + rsrc + '/';
        var data = 'algo=' + algo + '&start=' + start + "&count=" + 
            count + '&cols=' + encodeURIComponent(cols) + '&title=' + 
            encodeURIComponent(title) + '&args=' + encodeURIComponent(args);
        
        if(type == "classify")
        {
            var predictStart = $('#predict-start-num').val();
            var predictCount = $('#predict-count-num').val();
            if(predictCount == "-1") predictCount = "";
            var label = $('#predict-label-text').val();
            if(label == "")
            {
                alert('请填写标签。');
                return;
            }
            
            data += '&predictStart=' + predictStart + '&predictCount=' + 
                predictCount + '&label=' + label;
        }
        
        if(type != 'assoc') {
            var absent = $('#absent-combo').val();
            var fillval = $('#fillval-text').val();
            var formal = $('#formal-combo').val();
            var distinct = $('#distinct-cb').is(':checked').toString();
            data += '&absent=' + absent + '&fillval=' + 
                fillval + '&formal=' + formal + '&distinct=' + distinct;
        }
        
        $.ajax({
            type: "POST", 
            url: url, 
            data: data,
            dataType: "json",
            contentType: "application/x-www-form-urlencoded"
        }).done(function(data){
           if(!data.succ)
               alert(data.msg);
           else {
               alert('已提交。');
               location.href = './history.html';
           }
        }).fail(function(data, status, e){
            alert("network error");
        });
    };
    
    var initAlgoType = function() {
        
        var $typeCombo = $('#type-combo');
        for(type in algos)
            $('<option value="' + type + '">' + algoDict[type] + '</option>').appendTo($typeCombo);
        $typeCombo.on('change', changeAlgoType);
        changeAlgoType.call($typeCombo);
        var $algoCombo = $('#algo-combo');
        $algoCombo.on('change', changeAlgo);
        changeAlgo.call($algoCombo);
    };
    
    var changeAlgoType = function() {
        
        var type = $(this).val();
        var $algoCombo = $('#algo-combo');
        $algoCombo.empty();
        for(var i in algos[type])
        {
            var algo = algos[type][i];
            $('<option value="' + algo + '">' + algoDict[algo] + '</option>').appendTo($algoCombo);
        }
        
        if(type == "classify")
            $('.classify-req').removeClass('hidden');
        else
            $('.classify-req').addClass('hidden');
        
        if(type == 'assoc')
            $('#prepro-panel').addClass('hidden');
        else
            $('#prepro-panel').removeClass('hidden')
        
        $algoCombo.on('change', changeAlgo);
        changeAlgo.call($algoCombo);
    };
    
    var absentComboOnClick = function() {
        if($('#absent-combo').val() == "val") 
            $('.fillval').removeClass('hidden');
        else
            $('.fillval').addClass('hidden');
    };
    
    var changeAlgo = function() {
        $('.args').addClass('hidden');
        var algo = $('#algo-combo').val();
        if(algo == "apriori")
            $('#apriori-arg').removeClass('hidden');
        else if (algo == "kmeans")
            $('#kmeans-arg').removeClass('hidden');
        else if (algo == "kmedoids")
            $('#kmedoids-arg').removeClass('hidden');
        else if (algo == "svm")
            $('#svm-arg').removeClass('hidden');
    };
    
    getCols();
    initAlgoType();
    $('#mining-btn').click(mining);
    $('#absent-combo').click(absentComboOnClick);
});