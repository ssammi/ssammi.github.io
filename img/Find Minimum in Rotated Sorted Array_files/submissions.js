$(document).ready(function() {
    function formatProblem (problem) {
        if (problem.loading) return problem.text;
        var markup;
        if (problem.type=='problem') {
            markup = "<article class='media'>"
            markup += "<div class='pull-left'><span class='fa fa-stack fa-2x'><i class='fa fa-circle text-info fa-stack-2x'></i><i class='fa fa-star text-white fa-stack-1x'></i></span></div>"
            markup += "<div class=media-body>" + problem.pid + ". " + problem.title + "</div>";
            if (problem.alias!='')
                markup += "<div class=problem_alias><small class='problem_alias test-sm'> Alias: " + problem.alias + "</small></div>";                
            markup += '<span class="label difficulty text-sm pull-left ' + problem.background + '"style="min-width:65px">' + problem.level +'</span>';
            markup += '<span class="badge pull-left rate" style="margin: 0px 5px;min-width:50px">' + problem.rate + ' %</span>';
            markup += "</article>"
        } else {
            markup = "<article class='media'>"
            markup += '<div class="pull-left"><span class="fa fa-stack fa-2x"><i class="fa fa-circle text-primary fa-stack-2x"></i><i class="fa fa-tag text-white  fa-stack-1x"></i></span></div>'
            markup += "<div class=media-body>" + problem.title + "</div>";
            markup += "<div class=problem_alias><small class='problem_alias test-sm'>" + problem.tag_type + "</small></div>";
            if (problem.parent)
                markup += '<span class="label difficulty text-sm pull-left bg-primary" style="min-width:65px">' + problem.parent +'</span>';
            if (problem.count)
                markup += '<span class="badge pull-left rate" style="margin: 0px 5px;min-width:50px">' + problem.count + '</span>';                
            markup += "</article>"
        }
        return markup;
    }
    function formatProblemSelection (problem) {
        if (problem.pid)
            return (problem.pid + "." +problem.title);
        return problem.title;
    }
    $(".js-problem-ajax").select2({
        ajax: {
            url: "/" + window.language_code + "/search/api/problem",
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    search_query: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.result
                };
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 1,
        templateResult: formatProblem,
        templateSelection: formatProblemSelection
    });
    $(".js-submission-ajax").select2({
        ajax: {
            url: "/" + window.language_code + "/search/api/submission",
            dataType: 'json',
            delay: 250,
            data: function (params) {
                return {
                    search_query: params.term
                };
            },
            processResults: function (data) {
                return {
                    results: data.result
                };
            },
            cache: true
        },
        escapeMarkup: function (markup) { return markup; },
        minimumInputLength: 1,
        templateResult: formatProblem,
        templateSelection: formatProblemSelection
    });
});
