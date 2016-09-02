var language_to_mode = { "Java": "java", "C++": "c_cpp", "Python": "python" };
var language_to_id = { "Java": "java", "C++": "cpp", "Python": "python" };
var editor = ace.edit("editor");

editor.setTheme("ace/theme/xcode");
editor.getSession().setMode("ace/mode/java");
editor.getSession().setUseWrapMode(true);
editor.getSession().setWrapLimitRange(80, 120);
editor.setAutoScrollEditorIntoView(true)
editor.getSession().setUseSoftTabs(true);
editor.$blockScrolling = Infinity;

function get_code_key() {
    // problem-1000-language-java
    return 'problem-' + $('#problem-id').val() + '-language-' + $('#code-language').val();
}

function fetchCode(language) {
    $('.loading').show();
    $.ajax({
        async: true,
        url: '/problem/api/code/',
        type: 'get',
        data: {
            'problem_id': $("#problem-id").val(),
            'language': language
        },
        success: function(data) {
            var response = eval('(' + data + ')');
            var code = '';
            if (!response['success']) {
                console.log(response['error']);
                code = 'Load failed, please refresh the page';
            } else {
                code = response['code'];
                $.localStorage.setItem(get_code_key(), code);
            }

            editor.setValue(unescape(code), -1);
            $('.loading').hide();
        } // success
    }); // ajax
}

function setLangAndCode(desiredLang) {
    var langMode = 'ace/mode/' + language_to_mode[desiredLang];
    editor.getSession().setMode(langMode);
    $('#code-language').val(desiredLang);
    $.localStorage.setItem('previousLang', desiredLang);

    // set code
    var code = $.localStorage.getItem(get_code_key());
    if (code != null && code != '') { 
        editor.setValue(unescape(code), -1);
    } else {
        fetchCode(desiredLang);
    }
};

$('.reset').on('click', function() {
    var problem_id = $('#problem-id').val();
    var language = $('#code-language').val();
    $.confirm({
        text: $(this).data('text'),
        title: $(this).data('title'),
        confirmButton: $(this).data('confirm-button'),
        cancelButton: $(this).data('cancel-button'),
        confirm: function(button) {
            $('.loading').show();
            $.ajax({
                async: true,
                url: '/problem/api/reset/',
                type: 'get',
                data: {
                    'problem_id': problem_id,
                    'language': language
                },
                success: function(data) {
                    var response = eval('(' + data + ')');
                    editor.setValue(unescape(response['code']), -1);
                    $('.loading').hide();
                } // success
            }); // ajax
        },
    });
});

function editorOnChange (e) {
    $.localStorage.setItem(get_code_key(), escape(editor.getValue()));
};
editor.getSession().addEventListener('change', editorOnChange);

function expandEditor() {
    $('#expand-chevron').removeClass('fa-chevron-left').addClass('fa-chevron-right');
    $('#problem-aside').animate({width: '30%'});
    $('#problem-aside').attr('expanded', 'true');
};

function compressEditor() {
    $('#expand-chevron').removeClass('fa-chevron-right').addClass('fa-chevron-left');
    $('#problem-aside').animate({width: '50%'});
    $('#problem-aside').attr('expanded', 'false');
};

$('#expand-btn').on('click', function(e) {
    if ($('#problem-aside').attr('expanded') != 'true') {
        expandEditor();
    } else {
        compressEditor();
    }
});

editor.on('focus', function(e) {
    if ($('#problem-aside').attr('expanded') != 'true') {
        expandEditor();
    }
});

editor.setOptions({
    maxLines: Infinity,
    hScrollBarAlwaysVisible: false,
    vScrollBarAlwaysVisible: false
});

$(document).ready(function () {
    var previousLang = $.localStorage.getItem('previousLang');
    if (previousLang != '' && previousLang != null) {
        setLangAndCode(previousLang);
    } else {
        setLangAndCode('Java');
    }
    editor.setOption("maxLines", Math.floor(($(window).height() - 100) / $('#editor > div.ace_scroller > div > div.ace_layer.ace_text-layer > div:nth-child(1)').height()));
});

$(window).resize(function() {
    editor.setOption("maxLines", Math.floor(($(window).height() - 100) / $('#editor > div.ace_scroller > div > div.ace_layer.ace_text-layer > div:nth-child(1)').height()));
});

var submission_id;
var test_submission_id;
var time_interval;
var waiting_time;
var refresh_timeout=null;

function judge_finished(status) {
    return status != 'Pending' && 
           status != 'Rejudge Pending' &&
           status != 'Running' &&
           status != 'Compiling';
}

function set_status(status, hint) {
    var parent = $('#result-status').parent();
    parent.removeClass('text-success')
          .removeClass('text-danger')
          .removeClass('text-info')
          .removeClass('text-warning');
    $('#result-status').html(status);
    $('#hint').hide();
    if (hint) {
        $('#hint').show();
        $('#hint-detail').html(hint);
        $('#hint-detail').show();
    }
    if (status == 'Pending' || status == 'Rejudge Pending') {
        parent.addClass('text-light');
    } else if (status == 'Compiling') {
        parent.addClass('text-primary');
    } else if (status == 'Running') {
        parent.addClass('text-info');
    } else if (status == 'Accepted') {
        parent.addClass('text-success');
    } else if (status == 'Compile Error') {
        parent.addClass('text-warning');
    } else {
        parent.addClass('text-danger');
    }
    if (!judge_finished(status)) {
        $('#result-status').append(' <i class="fa fa-spinner fa-spin"></i>');
    }
}

function set_progress(progress) {
    $('#data-accepted-progress').attr('progress', progress);
    $('#data-accepted-progress').attr('data-original-title', progress + '%');
    $('#data-accepted-progress').attr('style', 'width: ' + progress + '%');
}

function set_success_result(response) {
    set_status(response['status'], response['hint']);

    $('#result-judge-container').show();

    if ('input' in response && response['input'].length !== 0) {
        $('.result-input-data').html(response['input']);
        $('.result-input').fadeIn();
    }

    if ('input_data_url' in response && response['input_data_url'].length !== 0) {
        $('#result-input-data-url').attr('href', response['input_data_url']);
        $('#result-input-data-url').fadeIn();
    }

    if ('output' in response && response['output'].length !== 0) {
        $('.result-output-data').html(response['output']);
        $('.result-output').fadeIn();
    }

    if ('expected' in response && response['expected'].length !== 0) {
        $('.result-expected-data').html(response['expected']);
        $('.result-expected').fadeIn();
    }

    if ('expected_data_url' in response && response['expected_data_url'].length !== 0) {
        $('#result-expected-data-url').attr('href', response['expected_data_url']);
        $('#result-expected-data-url').fadeIn();
    }

    if ('error_message' in response && response['error_message'].length !== 0) {
        $('.result-error-message').html(response['error_message']);
        $('.result-error').fadeIn();
    }

    if ('compile_info' in response && response['compile_info'].length !== 0 && response['status'] != 'Accepted') {
        $('.result-compile-info').html(response['compile_info']);
        $('.result-compile').fadeIn();
    }

    if ('lint_info' in response && response['lint_info'].length !== 0) {
        $('#result-lint-container').show();
        $('.result-lint-info').html(response['lint_info']);
        $('.result-lint').fadeIn();
    }

    var passed_percentage = 0;
    if (response['data_total_count']) {
	   passed_percentage = response['data_accepted_count'] * 100 / response['data_total_count'];
	   passed_percentage = Math.round(Math.sqrt(passed_percentage) * 7+ passed_percentage*passed_percentage * 3/1000);
    }
    $('.result-data-passed').html(passed_percentage);
    $('.result-runtime').html(response['time_cost']);

    if (response['data_total_count'] != 0) {
        $('#data-accepted-progress').removeClass("progress-bar-info").addClass("progress-bar-success");
        set_progress(passed_percentage);
    }

    if (!judge_finished(response['status'])) {
        waiting_time += time_interval;
        if (time_interval < 5000) {
            time_interval = time_interval * 3 / 2;   // * 1.5
        }
        if (waiting_time < 10 * 60 * 1000) {
            refresh_timeout = setTimeout(refresh, time_interval);
        } else {
            $("#submit-btn").attr("disabled", false);
            set_status('Request timeout, please try again');
        }
    } else {
        $("#submit-btn").attr("disabled", false);
        if (response['status'] == 'Accepted') { 
            // if this is in home page, show login dialog.
            if (window.location.href.indexOf('problem') == -1) {
                $("#login-window").modal('show').slideUp(1000);
            }
            $('#accepted-message').fadeIn(500);
            $('#recommend-problems').fadeIn(500);
        } // Accepted
    } // judge finished

}


function refresh() {
    $.ajax({
        url: '/submission/api/refresh/',
        type: 'get',
        data: {'id': submission_id, 'waiting_time': waiting_time},
        async: true,
        success: function(data) {
            var response = eval('(' + data + ')');
            set_success_result(response);
        } // success
    }); // ajax
}

$('#submit-btn').on('click', function(e){
    $(this).attr("disabled", true);
    $('.nav-tabs a[href="#judge"]').tab('show');
    $('#result-judge-container').show();
    $('#result-lint-container').show();
    $('.result').hide();
    set_status('Pending');
    $('#recommend-problems').hide();
    set_progress(0);
    time_interval = 100;
    waiting_time = 0;
    if (refresh_timeout !== null) {
        clearTimeout(refresh_timeout);
    }

    $('.result-data-accepted').html('0');
    $('.result-data-total').html('0');
    $('.result-runtime').html('0');

    $.ajax({
        async: true,
        url: '/submission/api/submit/',
        type: 'post',
        data: {
            'code': editor.getValue(),
            'problem_id': $('#problem-id').val(),
            'language': $('#code-language').val(),
            'csrfmiddlewaretoken': $.cookie('csrftoken')
        },
        success: function(data) {
            data = eval('(' + data + ')');
            if (data['success'] == false) {
                if (data['message'] == 'login required') {
                    window.location.replace(data['redirect_uri']);
                } else {
                    set_status(data['message']);
                }
                $("#submit-btn").attr("disabled", false);
                return;
            }
            submission_id = data['id'];
            refresh_timeout = setTimeout(refresh, time_interval);
        }
    });
});

$('#lint-btn').on('click', function(e){
    $('.result').hide();
    $('#result-lint-container').show();
    $('.result-lint-info').html('<i class="fa fa-spinner fa-spin"></i>');
    $('.result-lint').show();
    $('.nav-tabs a[href="#judge"]').tab('show');
    $.ajax({
        async: true,
        url: '/submission/api/lint/',
        type: 'post',
        data: {
            'code': editor.getValue(),
            'problem_id': $('#problem-id').val(),
            'language': $('#code-language').val(),
            'csrfmiddlewaretoken': $.cookie('csrftoken')
        },
        success: function(data) {
            data = eval('(' + data + ')')
            if (data['success'] == false) {
                if (data['message'] == 'login required') {
                    window.location.replace(data['redirect_uri']);
                } else {
                    set_status(data['message']);
                }
                return;
            }
            $('#result-lint-container').show();
            $('.result-lint-info').html(data['lint_info']);
            $('.result-lint').fadeIn();
        }
    });
});

$('#edit-btn').on('click', function(e) {
    $('.nav-tabs a[href="#judge"]').tab('show');
    $("#submit-btn").attr("disabled", false);
    $("#lint-btn").attr("disabled", false);
    $("#reset-btn").attr("disabled", false);
    $('#code-language').prop('disabled', false);
    $("#edit-btn").hide();
    editor.setReadOnly(false);
});

$('#yes').on('click', function(e) {
    $(this).hide();
    $('#company-list').show();
});

$('.company').on('click', function(e) {
    console.log($(this).attr('problem_id'));
    $.ajax({
        async: true,
        url: '/vote/interview/',
        type: 'post',
        data: {
            'problem_id': $(this).attr('problem_id'),
            'company_id': $(this).attr('company_id'),
            'csrfmiddlewaretoken': $.cookie('csrftoken')
        },
        success: function(data) {
            $('.company').hide();
            $('#feedback').show();
        } // success
    }); // ajax
});

function set_test_success_result(response) {
    // this is actually means run successfully, but not guarantee the output are the same.
    if (judge_finished(response['status'])) {
        $("#ct-run").attr("disabled", false);
        // if status is MLE, TLE or other, we should show status to user.
        if (response['status'] == 'Accepted')
            $('#ct-status').hide();
        else {
            var status = response['status']
            $('#ct-status').removeClass('text-success')
            $('#ct-status').removeClass('text-danger')
            $('#ct-status').removeClass('text-info')
            $('#ct-status').removeClass('text-warning');
            $('#ct-status').html(status);
            if (status == 'Rejudge Pending') {
                $('#ct-status').addClass('text-light');
            } else if (status == 'Compile Error') {
                $('#ct-status').addClass('text-warning');
            } else {
                $('#ct-status').addClass('text-danger');
            }
        }
        
        $('.ct-result').show();

        if ('error_message' in response && response['error_message'].length !== 0) {
            $('#ct-error').html(response['error_message']);
            $('.ct-error').show();
        }

        if ('compile_info' in response && response['compile_info'].length !== 0) {
            $('#ct-compile').html(response['compile_info']);
            $('.ct-compile').show();
        }

        $('.ct-input').hide();
        if ('input' in response && response['input'].length !== 0) {
            $('#ct-input').html(response['input']);
            $('.ct-input').show();
            console.log('input', response['input']);
        }

        $('.ct-output').hide();
        if ('output' in response && response['output'].length !== 0) {
            $('#ct-output').html(response['output']);
            $('.ct-output').show();
            console.log('output', response['output']);
        }

        $('.ct-expected').hide();
        if ('expected' in response && response['expected'].length !== 0) {
            $('#ct-expected').html(response['expected']);
            $('.ct-expected').show();
            console.log('expected', response['expected']);
        }

        // show hint
        $('#ct-hint').hide();
        if (response['hint']) {
            $('#ct-hint').show();
            $('#ct-hint-detail').html(response['hint']);
            $('#ct-hint-detail').show();
        }

        return;
    }

    if (response['status'] == 'Compiling') {
        $('#ct-status').html(
            '<span class="text-primary">Compiling...' + 
            '<i class="fa fa-spinner fa-spin"></i></span>');
    }

    if (response['status'] == 'Running') {
        $('#ct-status').html(
            '<span class="text-info">Running...' + 
            '<i class="fa fa-spinner fa-spin"></i></span>');
    }

    waiting_time += time_interval;
    if (time_interval < 5000) {
        time_interval = time_interval * 3 / 2;   // * 1.5
    }
    if (waiting_time < 5 * 60 * 1000) {
        refresh_timeout = setTimeout(refresh_test_submission, time_interval);
    } else {
        $("#ct-run").attr("disabled", false);
        $('#ct-status').html(
            '<span class="text-danger">Timeout, try again</span>');
    }
}

function refresh_test_submission() {
    $.ajax({
        url: '/submission/api/refresh/',
        type: 'get',
        data: {
            'id': test_submission_id,
            'waiting_time': waiting_time,
            'is_test_submission': true
        },
        async: true,
        success: function(data) {
            var response = eval('(' + data + ')');
            set_test_success_result(response);
        } // success
    }); // ajax
}

function isNormalCharacter(input) {
    for(var i = 0; i < input.length; ++i) {
        if (input.charAt(i).charCodeAt() < 0 ||
            input.charAt(i).charCodeAt() >= 128)
            return false;
    }
    return true;
}
$('#ct-run').on('click', function(e) {
    $('.ct-item').hide();
    $('#ct-warning').hide();
    if (!isNormalCharacter($('#input-testcase').val())) {
        $('#ct-warning').show();
        return;
    }

    $(this).attr("disabled", true);
    $('#ct-status').removeClass('text-success')
    $('#ct-status').removeClass('text-danger')
    $('#ct-status').removeClass('text-info')
    $('#ct-status').removeClass('text-warning');
    $('#ct-status').show();
    $('#ct-status').html(
        '<span class="text-light">Pending...' +
        '<i class="fa fa-spinner fa-spin"></i></span>');
    time_interval = 100;
    waiting_time = 0;
    if (refresh_timeout !== null) {
        clearTimeout(refresh_timeout);
    }

    $.ajax({
        async: true,
        url: '/submission/api/submit/',
        type: 'post',
        data: {
            'code': editor.getValue(),
            'problem_id': $('#problem-id').val(),
            'language': $('#code-language').val(),
            'input': unescape(encodeURIComponent($('#input-testcase').val())),
            'is_test_submission': true,
            'csrfmiddlewaretoken': $.cookie('csrftoken')
        },
        success: function(data) {
            data = eval('(' + data + ')');
            test_submission_id = data['id'];
            refresh_timeout = setTimeout(refresh_test_submission, time_interval);
        }
    });
});
