var g_chart_data = {inited: false, datasets:{}, datasets_l:[]};

function update_charts() {
    make_charts($("#x").val(),$("#y").val());
}

function eval_axis(pcoeffs,sel,e) {
    if (sel == "Performance") {
        var ret = 0;
        for (var coeff in pcoeffs) {
            if (e.perf[coeff] == 0 && pcoeffs[coeff] != 0) {
                ret = NaN;
            }
            ret += e.perf[coeff] * pcoeffs[coeff];
        }
    } else {
        ret = e.cost[sel].n.rop; // TODO: 2n?
    }
    return ret;
}

function make_charts(xaxis,yaxis) {    
    var ctx = document.getElementById('chart').getContext('2d');
    
    var xsel = $("#x"), ysel = $("#y")
     rops = {};
    
    var perftypes = {sk:1,pk:1,bytes:1,enc:1e-3,dec:1e-3,keypair:1e-3};
    var perfx = {}, perfy = {};
    for (var t in perftypes) {
        if (!g_chart_data.inited) {
            $("#x"+t).on("change", update_charts);
            $("#y"+t).on("change", update_charts);
        }
        perfx[t] = $("#x"+t).val() * perftypes[t];
        perfy[t] = $("#y"+t).val() * perftypes[t];
    }
    
    for (var i=0; i<estimates.length; i++) {
        var e = estimates[i];
        
        if (i==0 && !g_chart_data.inited) {
            // create dropdown
            g_chart_data.inited = true;
            for (var j=0; j<models.length; j++) {
                var c = models[j];
                $('<option />', {value: c.name, text: c.name}).appendTo(xsel);
                $('<option />', {value: c.name, text: c.name}).appendTo(ysel);
                if (j==0) {
                    ysel.val(c.name);
                    yaxis = c.name;
                }
            }
        }
        
        if (!("perf" in e)) continue;
        
        var x = eval_axis(perfx,xaxis,e);
        var y = eval_axis(perfy,yaxis,e);
        
        if (x==0 || y==0 || isNaN(x) || isNaN(y)) continue; // Means a crash, or no data selected
        if (e.key in rops) {
            rops[e.key].y = Math.min(rops[e.key].y,y);
            rops[e.key].x = Math.min(rops[e.key].x,x);
        }
        else rops[e.key] = {x:x,y:y,submission:e.perf.Submission,label:e.key,data:e};
    }

    var datasets = g_chart_data.datasets, datasets_l = g_chart_data.datasets_l;
    for (var i=0; i<datasets_l.length; i++) {
        datasets_l[i].data = [];
    }
    
    for (var k in rops) {
        var rk = rops[k], sub = rk.submission, ds;
        
        if (sub in datasets) {
            ds = datasets[sub];
        } else {
            var hue = Math.round((datasets_l.length*360*0.618) % 360);
            ds = datasets[sub] = {label:sub,data:[],radius:4,
                borderColor:"hsl(" + hue + ",100%,50%)",
                backgroundColor:"hsl(" + hue + ",100%,50%,0.2)"};
            datasets_l.push(ds);
        }
        ds.data.push(rk);
    }
    
    var xaxis_type = (xaxis=="Performance" ? "logarithmic" : "linear"),
        yaxis_type = (yaxis=="Performance" ? "logarithmic" : "linear");
    
    if ("scatterChart" in g_chart_data)
        
    
    if ("scatterChart" in g_chart_data) {
        var chart = g_chart_data.scatterChart;
        if (chart.config.options.scales.xAxes[0].type != xaxis_type
            || chart.config.options.scales.yAxes[0].type != yaxis_type) {
            // TODO
            chart.destroy();
            delete g_chart_data.scatterChart;
        } else {
            chart.config.options.scales.xAxes[0].scaleLabel.labelString = xaxis;
            chart.config.options.scales.yAxes[0].type = (yaxis=="Performance" ? "logarithmic" : "linear");
            chart.config.options.scales.yAxes[0].scaleLabel.labelString = yaxis;
            chart.update();
        }
    }
    if (!("scatterChart" in g_chart_data)) {
        g_chart_data.scatterChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: datasets_l
            },
            options: {
                scales: {
                    xAxes: [{
                        type: xaxis_type,
                        position: 'bottom',
                        scaleLabel: {
                            display: true,
                            labelString: xaxis
                        }
                    }],
                    yAxes: [{
                        type: yaxis_type,
                        scaleLabel: {
                            display: true,
                            labelString: yaxis
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(it, data) {
                            var ds = data.datasets[it.datasetIndex], p = ds.data[it.index];
                            var ret = [p.label,
                                "sk:  " + p.data.perf.sk,
                                "pk:  " + p.data.perf.pk,
                                "ct:  " + p.data.perf.bytes,
                                "Gen: " + p.data.perf.keypair,
                                "Enc: " + p.data.perf.enc,
                                "Dec: " + p.data.perf.dec];
                            if (xaxis in e.cost) {
                                ret.push(xaxis + ": " + e.cost[xaxis].n.rop.toFixed(2));
                            }
                            if (yaxis in e.cost && yaxis != xaxis) {
                                ret.push(yaxis + ": "+ e.cost[yaxis].n.rop.toFixed(2));
                            }
                            return ret;
                        }
                    }
                }
            }
        });
    }
}