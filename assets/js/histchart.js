/* **********************************************
// Load canned data
//
// collate the data
for(var ix = 0;ix < sensordata.length; ix++) {
    colldata[sensordata[ix].dev_id].push(sensordata[ix]);
}

// proof that it worked
console.log(colldata['ESP_49ECCD'].length);
console.log(colldata['ESP_49F542'].length);
console.log(colldata['ESP_49EC8B'].length);
console.log(colldata['ESP_49EB40'].length);

// transfer some data from the collation into the 
// chart series data
var device = histchart_cfg.title.text = 'ESP_49ECCD';

for(ix = 0; ix < colldata[device].length; ix++) {
    var arr = [colldata[device][ix].tstamp, colldata[device][ix].t];
    temps.push(arr);

    arr = [colldata[device][ix].tstamp, colldata[device][ix].h];
    humid.push(arr);
}

********************************************** */
/* ********************************************** */
var chart = {};
function newChart(newcfg = undefined) {
    // create & render the chart using the data series
    if(newcfg === undefined)
        chart = new ApexCharts(document.querySelector('#chart'), histchart_cfg);
    else
        chart = new ApexCharts(document.querySelector('#chart'), newcfg);

    chart.render();
};

function collateData(newdata) {
    // collate the data
    colldata = null;
    for(var ix = 0;ix < newdata.length; ix++) {
        colldata[newdata[ix].dev_id].push(newdata[ix]);
    }
};

function loadSeries(data) {
    temps = [];
    humid = [];
    mins = {t:1000,h:1000};

    for(ix = 0; ix < data.length; ix++) {
        var arr = [data[ix].tstamp, data[ix].t];
        temps.push(arr);
        if(data[ix].t < mins.t) {
            mins.t = data[ix].t;
        }
        arr = [data[ix].tstamp, data[ix].h];
        humid.push(arr);
        if(data[ix].h < mins.h) {
            mins.h = data[ix].h;
        }
    }
    mins.t = mins.t + MIN_ADJ;
    mins.h = mins.h + MIN_ADJ;
};

function loadTempSeries(data) {
    temps = [];
    humid = [];
    for(ix = 0; ix < data.length; ix++) {
        var arr = [data[ix].tstamp, data[ix].t];
        if(temps[data[ix].dev_id] === undefined) {
            temps[data[ix].dev_id] = [];
        }
        temps[data[ix].dev_id].push(arr);
    }
};

newChart();

// incoming configuration data...
$(document).on('config', function(e, _config) {
    var config = JSON.parse(_config);
    config.forEach(function(cfg) {
        if(cfg.loc !== 'X') {
            names[cfg.dev_id] = cfg.loc;
            colors[cfg.dev_id] = [cfg.t_color,cfg.h_color]; 
            consolelog(`config - ${cfg.dev_id} = ${cfg.loc}`);
        }
    });

    var devs = Object.entries(names);

    // iterate through all of the sensor selection checkboxes
    // and initialize them by adding a device ID and name.
    var sensors = document.getElementsByName('histsel_ctrl')
    var sensindex = 0;
    sensors.forEach(function(sens) {
        sens.value = devs[sensindex][0];
        sens.dataset.color = sensindex;
        sens.nextElementSibling.textContent = `\u00a0\u00a0${devs[sensindex][1]}`
        consolelog(`${sens.nextElementSibling.textContent}`);
        sensindex++;
    });
});

// incoming history data...
$(document).on('hist_show', function(e, _hist) {
    var hist = JSON.parse(_hist);
    if(hist.data === null) {
        alert('no data found');
        consolelog('hist_show - data is null - '+_hist);
        if(hist.err !== undefined) {
            alert('ERROR - err = '+JSON.stringify(hist.err));
            consolelog('hist_show - err = '+_hist);
        }
    } else {
        consolelog('hist_show - records = '+hist.data.length);
        // if data is a SINGLE sensor then....
        if(hist.query.dev_id.length === 1) {
            chart.destroy();
            histchart_cfg.series = [];
            histchart_cfg.title.text = names[hist.query.dev_id[0]];
            loadSeries(hist.data);
            histchart_cfg.series = [
                {name: '°F', data: temps},
                {name: '%RH', data: humid}
            ];
            histchart_cfg.colors = [
                colors[hist.query.dev_id[0]][0],
                colors[hist.query.dev_id[0]][1]
            ],
            histchart_cfg.yaxis = [
                {
                    min: mins.t,
                    title: {
                        text: 'Temp °F',
                        style: {
                            color: colors[hist.query.dev_id[0]][0]
                        }
                    },
                    labels: {
                        style: {
                            colors: [colors[hist.query.dev_id[0]][0]]
                        },
                        formatter: function (val) {
                            return val.toFixed(0)
                        }
                    }
                },
                {
                    min: mins.h,
                    opposite: true,
                    title: {
                        text: '%RH',
                        style: {
                            color: colors[hist.query.dev_id[0]][1]
                        }
                    },
                    labels: {
                        style: {
                            colors: [colors[hist.query.dev_id[0]][1]]
                        },
                        formatter: function (val) {
                            return val.toFixed(0)
                        }
                    }
                }
            ];
        } else {
            chart.destroy();
            histchart_cfg.series = [];
            histchart_cfg.title.text = '';
            hist.query.dev_id.forEach(function(devid, index) {
                histchart_cfg.title.text += names[devid];
                if(index < (hist.query.dev_id.length - 1))
                    histchart_cfg.title.text += ', ';
            });
    
            loadTempSeries(hist.data);
            // blank series object
            var tmp = {
                name: '',
                data: []
            }
            histchart_cfg.colors = [];
            // create one series for each sensor and put it
            // into the chart config(no references!)
            for(ix = 0;ix < hist.query.dev_id.length; ix++) {
                tmp.name = names[hist.query.dev_id[ix]];
                tmp.data = JSON.parse(JSON.stringify(temps[hist.query.dev_id[ix]]));
                histchart_cfg.series.push(JSON.parse(JSON.stringify(tmp)));
                histchart_cfg.colors.push(colors[hist.query.dev_id[ix]][0]);
            }
    
            histchart_cfg.yaxis = [
                {
                    title: {
                        text: 'Temp °F'
                    },
                    labels: {
                        formatter: function (val) {
                            return val.toFixed(0)
                        }
                    }
                }
            ];
        }
        // draw it!
        newChart();
    }
});

