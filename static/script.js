        var IntervalTimer = null;
        function textToSeconds(exp){
                hours = 0
                minutes = 0
                seconds = 0

                if(h = /(\d)\W?(hour(s)?|h)(\b)/g.exec(exp)){
                    hours += parseInt(h[1]);
                }
                if(h = /(\d)\W?(minute(s)?|m|min)(\b)/g.exec(exp)){
                     minutes += parseInt(h[1]);
                }
                if(h = /(\d)\W?(second(s)?|s|sec)(\b)/g.exec(exp)){
                     seconds += parseInt(h[1]);
                }
                if(h = /([a-z]+)\W?(hour(s)?|h)(\b)/g.exec(exp)){
                    hours += wordToNum(h[1]);
                }
                if(h = /([a-z]+)\W?(minute(s)?|m|min)(\b)/g.exec(exp)){
                     minutes += wordToNum(h[1]);
                }
                if(h = /([a-z]+)\W?(second(s)?|s|sec)(\b)/g.exec(exp)){
                     seconds += wordToNum(h[1]);
                }
                if(h=/(\d{1,2}):(\d{2})(:(\d{2}))?/g.exec(exp)){
                    hours += parseInt(h[1]);
                    minutes += parseInt(h[2]);
                    if(h.length == 5){
                        seconds += parseInt(h[4])
                    }

                }
                return seconds + 60*minutes + 3600*hours;
            }
            function secondsToText(secs){
                h = Math.floor(secs / 3600);
                m = secs % 3600;
                m = Math.floor(m / 60);
                s = secs % 60;
                return h + ':' + pad(m) + ':' + pad(s);
            }
            function pad(num) {
                return num < 10 ? '0' + num : num;
            }
            function wordToNum(word){
                var n = {
                    'one' : 1,
                    'two': 2,
                    'three': 3,
                    'four' : 4,
                    'five': 5,
                    'six' : 6,
                    'seven' : 7,
                    'eight' : 8,
                    'nine' : 9
                }
                if(word in n){
                    return n[word];
                }
                else{
                    return 0;
                }
            }
        function updateView(status){

                var b = $('#flood-button');
                var fs = $('#flood-status');
                var fst =  $('#flood-status-text');
                if(status == 'flooding'){
                    $('#flood-speed-select').slider('disable');
                    $('#flood-speed-custom').slider('disable');
                    $("#capture-select").prop('disabled', true);
                    $("#flood-duration").prop('disabled', true);

                    b.removeClass().addClass('btn btn-danger');
                    b.html('Kill Flood');
                    fs.removeClass().addClass('active');
                    fst.html('FlashFlood is active');
                    if(!IntervalTimer){
                        IntervalTimer = setInterval(function(e){
                            $.post('/status').done(function(e){
                                updateView(JSON.parse(e)['status'])
                            });
                        }, 3000);
                    }
                }
                if(status == "initialized"){
                    $('#flood-speed-select').slider('disable');
                    $('#flood-speed-custom').slider('disable');
                    $("#capture-select").prop('disabled', true);
                    $("#flood-duration").prop('disabled', true);

                    b.removeClass().addClass('btn btn-danger');
                    b.html('Kill Flood');
                    fs.removeClass().addClass('initialized');
                    fst.html('FlashFlood is initialized and will start soon');
                    if(!IntervalTimer){
                        IntervalTimer = setInterval(function(e){
                            $.post('/status').done(function(e){
                                updateView(JSON.parse(e)['status'])
                            });
                        }, 3000);
                    }
                }
                if(status == "decompressing"){
                    $('#flood-speed-select').slider('disable');
                    $('#flood-speed-custom').slider('disable');
                    $("#capture-select").prop('disabled', true);
                    $("#flood-duration").prop('disabled', true);

                    b.removeClass().addClass('btn btn-danger');
                    b.html('Kill Flood');
                    fs.removeClass().addClass('decompresing');
                    fst.html('FlashFlood is decompressing the data');
                    if(!IntervalTimer){
                        IntervalTimer = setInterval(function(e){
                            $.post('/status').done(function(e){
                                updateView(JSON.parse(e)['status'])
                            });
                        }, 3000);
                    }
                }
                if(status == "killed"){
                    $('#flood-speed-select').slider('disable');
                    $('#flood-speed-custom').slider('disable');
                    $("#capture-select").prop('disabled', true);
                    $("#flood-duration").prop('disabled', true);

                    b.html('Flood Killed');
                    fs.removeClass().addClass('killed');
                    fst.html('FlashFlood has been killed');
                    clearInterval(IntervalTimer);
                    IntervalTimer = null;
                    setTimeout(function(e){
                        $('#flood-speed-select').slider('enable');
                        $('#flood-speed-custom').slider('enable');
                        $("#capture-select").prop('disabled', false);
                        $("#flood-duration").prop('disabled', false);

                        b.removeClass().addClass('btn btn-primary');
                        b.html('Begin Flood');
                        fs.addClass('hidden');
                        fst.html('FlashFlood not yet started');
                    }, 1000);
                }
                if(status == "inactive"){
                        $('#flood-speed-select').slider('enable');
                        $('#flood-speed-custom').slider('enable');
                        $("#capture-select").prop('disabled', false);
                        $("#flood-duration").prop('disabled', false);

                        b.html('Begin Flood');
                        b.removeClass().addClass('btn btn-primary');
                        fs.addClass('hidden');
                        fst.html('FlashFlood has not yet started');
                        clearInterval(IntervalTimer);
                        IntervalTimer = null;
                    }
            }
        $(function(){
            $('#flood-speed-select').slider({
            ticks: [-1,0,1],
            ticks_labels: ['Line Rate', 'Live Replay', 'Custom Rate'],
                tooltip: 'hide'
            });
            $('#flood-speed-custom').slider({
                min: 10,
                max: 5000,
                scale: 'logarithmic',
                step: 10,
                formatter: function(value) {return value >= 1000 ? value/1000 + 'gbit' : value + 'mbit';},
            });
            $('#flood-speed-select').val() == '1' ? $('#flood-speed-custom').slider('enable') : $('#flood-speed-custom').slider('disable');
            $('#flood-speed-select').on('change', function(e){e.target.value == '1' ? $('#flood-speed-custom').slider('enable') : $('#flood-speed-custom').slider('disable');})
            $.post('/file_index').done(function(data){
                var options = $("#capture-select");
                $.each(JSON.parse(data)['files'], function(e){
                    options.append($("<option />").val(this).text(this));
                });
            });
            $('#flood-duration').keyup(function(e){
                var v = textToSeconds($(e.target).val());
                if(v > 0){
                    $('#formatted-time').html(secondsToText(v));
                    $('#formatted-time').data('seconds', v);
                }
                else if($(e.target).val() > 0){
                    $('#formatted-time').html("...");
                    $('#formatted-time').data('seconds', 0);
                }
                else{
                    $('#formatted-time').html("");
                    $('#formatted-time').data('seconds', 0);
                }
            });
            $('#flood-button').click(function(e){
                var fb = $(e.target);
                if(fb.hasClass('btn btn-primary')){
                    $.ajax('/flood', {data: {file: $("#capture-select").val(),
                        duration: $('#formatted-time').data('seconds'),
                        speed: ($('#flood-speed-select').val() == "1" ? $('#flood-speed-custom').val() : $('#flood-speed-select').val())}, type: 'POST'
                    }).done(function(f){
                        updateView(JSON.parse(f)['status']);
                    });
                }
                else{
                    $.post('/kill').done(function(f){
                        console.log(f);
                        updateView(JSON.parse(f)['status']);
                    });
                }
            });
             $.post('/status').done(function(e){
                                updateView(JSON.parse(e)['status'])
                            });
        });