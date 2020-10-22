/*
    SensorNet History Chart GUI Logic

    This is where the GUI is intialized and where the
    events (except for chart & picker) are handled

*/
// object to contain GUI selections as they occur
var choices = {
    dursel: '',
    datefrom: 0,
    dev_id: []
};

// options for the Zebra Datepicker
zdp_options = {
    _limit_month_selection: true,
// Although the following option is provided to 
// disable switching to other views it does NOT
// turn off the hover highlight. But the mods
// made for `_view_days_only` does disable it.
    // fast_navigation: false,
    _view_days_only: true,

    show_clear_date: false,
    first_day_of_week: 0,
    select_other_months: true,
    onSelect: null,
    direction: []
};

// When the doc is ready complete the initialization
$(document).ready(function() {
    // adjust the text color
    adaptColor('#titlehist', '.panel-success>.panel-heading');
    // adjust the text color
    adaptColor('#gethist');
    adaptColor('#resetchart');
    // disable the button because no sensors have been selected yet
    $('#gethist').prop('disabled',true);
    // disable the date picker until there is data for it and at 
    // least one sensor has been chosen
    $('#histpicker').prop('disabled', true);
    // set up the button handlers
    $('#gethist').on('click', function() {
        if(choices.datefrom === 0) choices.datefrom = stats.limit;
        consolelog('#gethist - '+JSON.stringify(choices));
        // {dursel: '24', dev_id:['ESP_49EC8B','ESP_AAAAAA',ESP_BBBBBB'}
        $(document).trigger('hist_request', choices);
    });

    // simple reset, just reload the page
    $('#resetchart').on('click', function() {
        location.replace(location.href.split('#')[0]); 
    });

    // the sensor stats have updated and we'll finish
    // setting the options for the picker
    $(document).on('pickerupdate', function(e, oldest) {
        zdp_options.onSelect = pickSelect;
        zdp_options.direction[0] = theDay(parseInt(oldest/1000));
//        zdp_options.direction[0] = theDay(1599340800);
        zdp_options.direction[1] = theDay();
        $('#histpicker').Zebra_DatePicker(zdp_options);
        $('#histpicker').data('Zebra_DatePicker').set_date(zdp_options.direction[0]);
    });

    // iterate through all of the sensor selection checkboxes
    // and add an onclick handler to each of them.
    var sensors = document.getElementsByName('histsel_ctrl')
    var senscount = 0;
    sensors.forEach(function(sens) {
        // this checkbox onclick handler will alter the color
        // of the checkbox label as it is selected or deselected.
        sens.onclick = function() {
            consolelog(this.value+'  '+this.checked);
            // manage the color with a css class when the checkbox 
            // has changed to either state
            if(this.checked === true) {
                this.parentElement.style = `color:${colors[this.value][0]}!important`;
                senscount += 1;
                // ADD this sensor to the choices.dev_id[] array
                choices.dev_id.push(this.value);
            } else {
                this.parentElement.style = '';
                senscount -= 1;
                // REMOVE this sensor from the choices.dev_id[] array
                sensrmv = this.value;
                choices.dev_id = choices.dev_id.filter(function(sens) {
                    var ret = (sens !== sensrmv);
                    return ret;
                });
            }
            // a count of selected sensors determines if the 
            // "get history" button is enabled or not, it also
            // determines if the picker is enabled and initialized
            if(senscount === 0) {
                $('#gethist').prop('disabled',true);
                var zdp = $('#histpicker').data('Zebra_DatePicker');
                //zdp.clear_date();
                $('#histpicker').prop('disabled',true);
                zdp.update();
            } else {
                $('#gethist').prop('disabled',false);
                adaptColor('#gethist');
                $('#histpicker').prop('disabled',false);
                var zdp = $('#histpicker').data('Zebra_DatePicker');
                zdp.update();
                if(zdp.get_date() === '')
                    zdp.set_date(zdp_options.direction[0]);
            }
        };
    });

    // Return a string "YYYY-MM-DD", and use either
    // the passed in epoch or use today
    function theDay(epoch = undefined) {
        var tmp = {};
        if(epoch === undefined) {
            tmp = new Date();
        } else {
            tmp = new Date(0);
            tmp.setUTCSeconds(epoch);
        }
        var theday = tmp.getFullYear()+'-';
        theday += ((tmp.getMonth() + 1) < 10 ? '0'+(tmp.getMonth() + 1) : (tmp.getMonth() + 1));
        theday += '-'+(tmp.getDate() < 10 ? '0'+tmp.getDate() : tmp.getDate());

        return theday;
    };

    // Zebra Datepicker selection handler, get the chosen
    // date and create an epoch value that represents 
    // YYYY-MM-DD 00:00:00 (local time), then place it
    // in the choices object for transmission to the server
    function pickSelect(dumb1, dumb2, dobj) {
    var _debug = false;

        // calculate the 00:00 time of the selected day
        var pickd = parseInt(dobj.getTime()/1000);
        var offs = (dobj.getTimezoneOffset() * 60);
        var lastmid = (Math.floor(pickd / 86400) * 86400) + offs;

        if(_debug) {
            var nextmid = ((Math.ceil(pickd / 86400) * 86400) - 1) + offs;
            consolelog(pickd);
            consolelog(lastmid);
            consolelog(nextmid);
            var tmp = new Date(0);
            tmp.setUTCSeconds(lastmid);
            console.log(tmp);
            tmp = new Date(0);
            tmp.setUTCSeconds(nextmid);
            console.log(tmp);
        }
        // get ready for the request for sensor data,
        // place our calculated date & time in the
        // query object.
        choices.datefrom = (lastmid * 1000);
    };

    // let the app know we're ready for incoming sensor data
    $(document).trigger('hist_ready', true);
    $('#history-panel').show();
});

