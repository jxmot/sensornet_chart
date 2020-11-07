/*
    Application Specific Socket.io Initialization and Event Handlers

    (c) 2017 Jim Motyl - https://github.com/jxmot/
*/
var socket;
var socketready = false;

const STATUS_EN_BIT = 0b000000001;
const DATA_EN_BIT   = 0b000000010;
const HIST_EN_BIT   = 0b000000100;
const CONFIG_EN_BIT = 0b000001000;
const PURGE_EN_BIT  = 0b000010000;
const WXF_EN_BIT    = 0b000100000;
const WXO_EN_BIT    = 0b001000000;
const STATS_EN_BIT  = 0b010000000;
const FUTURE_EN_BIT = 0b100000000;

const GAUGAPP_EN_BITS = (STATUS_EN_BIT | DATA_EN_BIT | PURGE_EN_BIT | WXF_EN_BIT | WXO_EN_BIT);
const HISTAPP_EN_BITS = (HIST_EN_BIT | CONFIG_EN_BIT | STATS_EN_BIT);

var currOptions = FUTURE_EN_BIT;

function initSocket(optbits = FUTURE_EN_BIT) {

    if(socketready === true) {
        consolelog('WARNING - socket is already connected');
        consolelog('INFO - applyOptions -> optbits ');
        applyOptions(optbits);
        return;
    }

    socket = io.connect(socketserver.host+':'+socketserver.port+'/', {
                        'reconnection': true,
                        'reconnectionDelay': 3000,
                        'reconnectionDelayMax' : 5000,
                        // FYI, it's odd... 5=6,4=5,etc. that's because
                        // the 1st attempt is actually a "connect". the
                        // "reconnect" attempts come after it.
                        'reconnectionAttempts': 4});

    socket.on('connect_error', function(error) {
        // it's convenient that the alert halts everything,
        // makes it easier when restarting the server.
        alert('connect_error - '+JSON.stringify(error));
    });

    socket.on('disconnect', function(){ 
        socketready = false;
        consolelog('INFO - socket was disconnected');
    });

    socket.on('server', function(data) {
        consolelog('server - '+JSON.stringify(data));
        // the server is ready
        if(data.status === true) {
            socketready = true;
// NOTE: the resend of sensorlast happens before
// we send this. Needs work
//            if(!(optbits & FUTURE_EN_BIT))
//                socket.emit('optbits', {opt:optbits});
        }
        else socketready = false;
    });
    applyOptions(optbits);
};

function manageListeners(opts, bit, evt, func) {

    if((opts & bit) && !(currOptions & bit)) {
        socket.on(evt, func);
    }

    if(!(opts & bit) && (currOptions & bit)) {
        socket.off(evt, func);
    }
};

function applyOptions(opts) {
    if(opts === FUTURE_EN_BIT) {
        alert('init error - must set option bits');
    } else {
        manageListeners(opts, STATUS_EN_BIT, 'status',   showStatus);
        manageListeners(opts, DATA_EN_BIT,   'data',     showData);
        manageListeners(opts, HIST_EN_BIT,   'histdata', showHistory);
        manageListeners(opts, CONFIG_EN_BIT, 'config',   saveConfig);
        manageListeners(opts, PURGE_EN_BIT,  'purge',    showPurge);
        manageListeners(opts, WXF_EN_BIT,    'wxfcst',   showWXFcast);
        manageListeners(opts, WXO_EN_BIT,    'wxobsv',   showWXObsv);
        manageListeners(opts, STATS_EN_BIT,  'stats',    saveStats);
        currOptions = opts;
    }
};

function showStatus(data) {
    consolelog('showStatus - '+JSON.stringify(data.payload));
    $(document).trigger(data.payload.dev_id, data.payload);
};

function showData(data) {
    consolelog('showData - '+JSON.stringify(data.payload));
    $(document).trigger(data.payload.dev_id, data.payload);
};

function showPurge(data) {
    consolelog('showPurge - '+JSON.stringify(data.payload));
    $(document).trigger('purge_status', data.payload);
};

function showWXObsv(data) {
    consolelog('showWXObsv - '+JSON.stringify(data.payload));
    $(document).trigger('wxsvc_obsv', data.payload);
};

function showWXFcast(data) {
    consolelog('showWXFcast - '+JSON.stringify(data.payload));
    $(document).trigger('wxsvc_fcst', data.payload);
};

function saveConfig(cfg) {
    $(document).trigger('config', JSON.stringify(cfg));
};

function saveStats(stats) {
    $(document).trigger('stats', JSON.stringify(stats));
};

function showHistory(hist) {
    $(document).trigger('hist_show', JSON.stringify(hist));
};

$(document).on('gauges_ready', function() {
    // initialize sockets for incoming sensor status and data
    initSocket(GAUGAPP_EN_BITS);
});

$(document).on('hist_ready', function() {
    // initialize sockets for incoming sensor config & data
    initSocket(HISTAPP_EN_BITS);
});

$(document).on('hist_request', function(e, histreq) {
    if(socketready === true) {
        consolelog('hist_request - ' + JSON.stringify(histreq));
        socket.emit('senshist', histreq);
    }
});

$(document).on('wxsvc_select', function(e, sel) {
    if(socketready === true) {
        consolelog('wxsvc_select - ' + sel);
        socket.emit('wxsvcsel', {wxsvc: sel});
    }
});


