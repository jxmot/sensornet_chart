/*
    SensorNet History Chart Configuration

    Requried for use with Apex Charts

    home: https://apexcharts.com/
    docs: https://apexcharts.com/docs/chart-types/line-chart/

    NOTE: Apex(free) is a subsidiary of Fusion Charts($$paid!!), 
    researched a number of other chart packages and either they
    were too expensive or lacked these needed features:
        * Dual and independant Y-axis <-- MUST HAVE!
        * Documented (Apex docs are just 'OK', they have a lot
          of info. it's not complete)
        * Can be used a 'live' data chart. So far this seems to 
          be the easiest to force new behavior. <-- MUST HAVE!
        * Open source - https://github.com/apexcharts/apexcharts.js
*/
// contains the data series
var temps = [];
var humid = [];
// contains the minimum values that are used for
// scaling the Y-axes when chartiing a single sensor
var mins = {
    t: 0,
    h: 0
};
// bump the min & max a little so that graphs
// don't touch the high/low of the scale(s)
const MIN_ADJ = -2;
const MAX_ADJ = +2
// device ID <-> recognizable name
var names = [];

// https://htmlcolorcodes.com/color-picker/
// use "complementary" colors
// device ID -> [t color, h color]
var colors = [];

// contains statistics for each sensor: 
//      oldest timestamp
//      record count
var stats = {};

// TODO: multiple configs? in an array?
// TODO: functions to handle specific configs

// chart config - refer to the Apex Charts documentation
var histchart_cfg = {
    series: [],
    theme: {
        mode:'dark'
    },
    stroke: {
        width: 3,
        curve: 'smooth'
    },
    chart: {
        type: 'line',
        stacked: false,
        height: 350,
        zoom: {
            type: 'x',
            enabled: true,
            autoScaleYaxis: false
        },
        toolbar: {
            autoSelected: 'zoom',
            tools: { 
                download: true 
            },
            export: {
                csv: {
                    filename: undefined
                },
                svg: {
                    filename: undefined
                },
                png: {
                    filename: undefined
                }
            }
        }
    },
    dataLabels: {
        enabled: false
    },
    markers: {
        size: 0,
    },
    title: {
        text: 'Chart Ready is for Data',
        align: 'left'
    },
    yaxis: [
        {
            min:55,
            max:95,
            title: {
                text: 'Temp °F'
            }
        },
        {
            opposite: true,
            min:40,
            max:60,
            title: {
                text: '%RH'
            }
        }
    ],
    xaxis: {
        type: 'datetime',
        labels: {
            datetimeUTC: false
        }
    },
    tooltip: {
        shared: true,
        y: {
            formatter: function (val) {
                return val.toFixed(2)
            }
        },
        x: {
            formatter: function (val) {
                var dt = new Date(val);
                var tod = dt.getFullYear() + '-' + (dt.getMonth()+1) + '-' + dt.getDate();
                var h = dt.getHours();
                var m = dt.getMinutes();
                var s = dt.getSeconds();
                tod = tod + '<br>'+ (h < 10 ? '0'+h : h) +':'+ (m < 10 ? '0'+m : m) +':'+ (s < 10 ? '0'+s : s);
                return tod;
            }
        }
    }
};
