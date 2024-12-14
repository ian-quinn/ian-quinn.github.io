// function converting date object to Julia day
const dayOfYear = date =>
    Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);

$('#btn-calculator').click(function() {
    console.log("clicked!");

    let city = $("[name='inp_city']").val();
    let stamp = $("[name='inp_date']").val();
    let psi = $("[name='inp_axis']").val();
    let cloudiness = $("[name='inp_clo']").val();
    let maxTemp = parseFloat($("[name='inp_temp1']").val());
    let minTemp = parseFloat($("[name='inp_temp2']").val());
    let uWall = $("[name='inp_uwall']").val();
    let uGlazing = $("[name='inp_uwin']").val();
    let ampPeople = $("[name='inp_peo']").val();
    let ampLight = $("[name='inp_lgt']").val();
    let ampEquip = $("[name='inp_eqp']").val();
    let setTemp = $("[name='inp_spt']").val();
    let SHGC = $("[name='inp_shgc']").val();
    let ctsf = $("[name='inp_ctsf']").val();
    let rts = $("[name='inp_rtf']").val();
    let H = $("[name='inp_h']").val();
    let Hsill = $("[name='inp_sill']").val();
    let WWR = $("[name='inp_wwr']").val();
    let cond = $("[name='inp_cond']").val();
    let den = $("[name='inp_den']").val();
    let cp = $("[name='inp_cp']").val();
    let thickness = $("[name='inp_thickness']").val();

    console.log(city);

    let temps = new Array(24);
    for (let i = 0; i < 24; i++) {
        temps[i] = (maxTemp-minTemp) * Math.sin((i-7) * Math.PI/12) / 2 + (maxTemp + minTemp) / 2;
    }

    let date = new Date(Date.parse(stamp));
    let month = date.getMonth(); // return month [0, 11]
    let day = date.getDate(); // returns the day in a month

    let toggleTemp = $('#temptoggle:checked').val();
    if (toggleTemp === 'on') {
        // overwrite temps with epw data
        fetch("./epw.json")
            .then((response) => response.json())
            .then((data) => {
                let tempSeries = data[city][month + 1].split(',').map(Number);
                for (let i = 0; i < 24; i++) {
                    temps[i] = tempSeries[(day - 1) * 24 + i];
                }
                let [dIso, dMix, dAvg_24, dAvg_10, Dmax, Dmin] = offsetCalc(city, stamp, psi, cloudiness, temps, uWall, uGlazing, ampPeople, ampLight, ampEquip, setTemp, SHGC, ctsf, rts, H, Hsill, WWR, cond, den, cp, thickness);
                drawECharts(dIso, dMix, dAvg_24, dAvg_10, Dmax, Dmin);
                logResults(dIso, dMix, dAvg_24, dAvg_10);
            });
    }
    else {
        let [dIso, dMix, dAvg_24, dAvg_10, Dmax, Dmin] = offsetCalc(city, stamp, psi, cloudiness, temps, uWall, uGlazing, ampPeople, ampLight, ampEquip, setTemp, SHGC, ctsf, rts, H, Hsill, WWR, cond, den, cp, thickness);
        drawECharts(dIso, dMix, dAvg_24, dAvg_10, Dmax, Dmin);
        logResults(dIso, dMix, dAvg_24, dAvg_10);
    }
})

function logResults(dIso, dMix, dAvg_24, dAvg_10) {
    let recordings = "hourly d presuming indoor heat gains are isolated: [" + dIso.toString() + "]\n" + 
        "hourly d presuming indoor heat gains are fully mixed: [" + dMix.toString() + "]\n" + 
        "24-hour average d by lumped indoor air: [" + dAvg_24.toString() + "]\n" + 
        "11-working-hour average d by lumped indoor air: [" + dAvg_10.toString() + "]";

    document.getElementById("recorder").value = recordings;
}

function drawECharts(dIso, dMix, dAvg_24, dAvg_10, Dmax, Dmin) {
    // Create an ECharts instance
    let myChart = echarts.init(document.getElementById('barChart'));

    // Specify chart configuration and data
    let options = {
        title: {
            text: ''
        },
        legend: {
            right: '10%'
        },
        xAxis: {
            type: 'category',
            name: 'hour',
            data: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', 
                '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
        },
        yAxis: {
            type: 'value',
            name: 'offset(m)',
            min: 0,
            max: 10
        },
        // the drawing order follows the sequence in series list
        series: [
            {
                name: 'dIso',
                type: 'bar',
                barGap: '-70%',
                itemStyle: {
                    color: '#ddd' // Set the color for Series 2
                },
                markLine: {
                    symbol:['none','none'],
                    data: [
                    {
                        name: '24_dAvg',
                        yAxis: dAvg_24,
                        lineStyle: {normal: {color: "#437caf", type: "solid"}},
                        label: {
                            show: true, 
                            position: 'insideEndTop',
                            formatter: '{b}: {c}'
                        }
                    }
                    ]
                },
                data: dIso
            },
            {
                name: 'dMix',
                type: 'bar',
                barGap: '-70%',
                itemStyle: {
                    color: '#b56a8d',
                    opacity: 0.8
                },
                markLine: {
                    symbol:['none','none'],
                    data: [
                    {
                        name: '10_dAvg',
                        yAxis: dAvg_10,
                        lineStyle: {normal: {color: "#437caf", type: "solid"}},
                        label: {
                            show: true, 
                            position: 'insideEndTop',
                            formatter: '{b}: {c}'
                        }
                    }
                    ]
                },
                data: dMix
            },
            {
                name: 'Asol',
                type: 'bar',
                barGap: '-70%',
                itemStyle: {
                    color: 'rgb(249, 174, 88)',
                    opacity: 0.5
                },
                data: [0]
            },
            {
                name: '',
                type: 'line',
                stack: 'all',
                label: { show: false },
                itemStyle: {
                    opacity: 0
                },
                lineStyle: {
                    color: 'rgb(249, 174, 88)',
                    opacity: 0
                },
                data: Dmin
            },
            {
                name: '',
                type: 'line',
                stack: 'all',
                label: { show: false },
                areaStyle: {
                    color: 'rgb(249, 174, 88)', 
                    opacity: 0.1
                },
                lineStyle: {
                    color: 'rgb(249, 174, 88)',
                    opacity:0
                },
                itemStyle: {
                    color: 'rgb(249, 174, 88)',
                    opacity:0
                    },
                data: Dmax
            }
        ]
    };

    // Set the chart options
    myChart.setOption(options);
}

// function to get the solar Zenith angle
function solarCalc(latitude, longitude, utc_offset, timestamp){
    let stamp = Date.parse(timestamp);
    let date = new Date(stamp);
    let hour = date.getHours();
    let minute = date.getMinutes();
    // Check your timezone to add the offset
    let hour_minute = (hour + minute / 60) - utc_offset;
    let day_of_year = dayOfYear(date);

    let g = (360 / 365.25) * (day_of_year + hour_minute / 24);

    let g_radians = g * Math.PI / 180.0;

    let declination = 0.396372 - 22.91327 * Math.cos(g_radians) + 4.02543 * Math.sin(g_radians) - 0.387205 * Math.cos(
        2 * g_radians) + 0.051967 * Math.sin(2 * g_radians) - 0.154527 * Math.cos(3 * g_radians) + 0.084798 * Math.sin(
        3 * g_radians);

    let time_correction = 0.004297 + 0.107029 * Math.cos(g_radians) - 1.837877 * Math.sin(g_radians) - 0.837378 * Math.cos(
        2 * g_radians) - 2.340475 * Math.sin(2 * g_radians);

    let SHA = (hour_minute - 12) * 15 + longitude + time_correction;

    let SHA_corrected = SHA;
    if (SHA > 180){ SHA_corrected = SHA - 360; }
    if (SHA < -180){ SHA_corrected = SHA + 360; }

    let lat_radians = latitude * Math.PI / 180.0;
    let d_radians = declination * Math.PI / 180.0;
    let SHA_radians = SHA * Math.PI / 180.0;

    let SZA_radians = Math.acos(Math.sin(lat_radians) * Math.sin(d_radians) +
        Math.cos(lat_radians) * Math.cos(d_radians) * Math.cos(SHA_radians));

    let SEA = 90 - SZA_radians / Math.PI * 180.0;

    let cos_AZ = (Math.sin(d_radians) - Math.sin(lat_radians) * Math.cos(SZA_radians)) / (
        Math.cos(lat_radians) * Math.sin(SZA_radians));

    let AZ_rad = Math.acos(cos_AZ);
    let AZ = AZ_rad / Math.PI * 180.0;

    if (hour > 12){ AZ = 360 - AZ; }

    return [SEA, AZ];
}

function ctsfCalc(conductivity, density, capacity, thickness, resistance, nLTotal){
    let COND = [0, conductivity, 0];
    let DEN = [0, density, 0];
    let CP = [0, capacity, 0];
    let Thickness = [0, thickness, 0];
    let Resistance = [0.044, resistance, 0.12]

    let X = new Array(125).fill(0);
    let XU = new Array(125).fill(0);
    let XCV = new Array(125).fill(0);
    let LayerAndNodeNumber = new Array(300).fill(0);
    let Lambda = new Array(300).fill(0);
    let RowCP = new Array(300).fill(0);

    let limit = 0.0000001; // limit for response factor calc convergence
    let small = 1e-20; // to avoid calculation crash

    // local variables
    let nCV = new Array(15).fill(0);
    for (let i = 0; i < nLTotal; i++) {
        // filter out air resistance layers and assign properties
        if (COND[i] === 0 && Resistance[i] !== 0) {
            COND[i] = 0.0263;
            DEN[i] = 1.1614;
            CP[i] = 1007;
            Thickness[i] = COND[i] * Resistance[i];
        }
        // set 6 as the default nodes of each layer
        nCV[i] = 6;
        // volume thermal properties
    }


    XU[2] = 0;
    let n2 = 2;
    for (let i = 0; i < nLTotal; i++) {
        let nLast = n2;
        let n1 = nLast + 1;
        n2 = nLast + nCV[i];
        for (let j = n1; j < n2 + 1; j++) {
            let spacing = (j - nLast) / nCV[i];
            XU[j] = XU[nLast] + Thickness[i] * spacing;
            LayerAndNodeNumber[j - 1] = i;
        }
    }

    let nMax = n2;
    //  of nodes in the construction
    //  Assign total number of nodes
    let nM2 = nMax - 1;
    let nM3 = nM2 - 1;
    X[1] = XU[2];
    for (let i = 2; i < nM2 + 1; i++) {
        X[i] = 0.5 * (XU[i+1] + XU[i]);
        XCV[i] = XU[i+1] - XU[i];
    }

    X[nMax] = XU[nMax];

    // X, XU, XCV # official returns

    // ReDim something
    let A = new Array(nMax+1).fill(0);
    let D = new Array(nMax+1).fill(0);
    let B = new Array(nMax+1).fill(0);
    let C = new Array(nMax+1).fill(0);
    let phi = new Array(nMax+1).fill(0);
    //let XYPHi = new Array(nMax+1).fill(0);
    //let ZPhi = new Array(nMax+1).fill(0);

    for (let i = 0; i < nMax + 1; i++) {
        phi[i] = 0;
    }

    //   assign layer number to each control volume in the construction
    for (let i = 2; i < nM2 + 1; i++) {
        let numLayer = LayerAndNodeNumber[i]; // check which layer it belongs to
        Lambda[i] = COND[numLayer];
        RowCP[i] = CP[numLayer] * DEN[numLayer];
    }

    //   start solving for temperature and response factors for each time step
    let XFlux = Infinity;
    let YFlux = Infinity;
    let ZFlux = Infinity;
    let XResponse = new Array(300).fill(0);
    let YResponse = new Array(300).fill(0);
    let ZResponse = new Array(300).fill(0);
    let HoursCount = 1;
    let TimeCount = 0;
    let TimeStep = 60;
    let N_TimeSteps = 9600;

    for (let StepCount = 1; StepCount < N_TimeSteps+1; StepCount++) {
        if (TimeCount >= 24 * 3600) {
            TimeStep = 60;
        }
        TimeCount = TimeCount + TimeStep;
        // solve the outside and cross response factors
        if (Math.abs(XFlux) < limit && Math.abs(YFlux) < limit && TimeCount > 7200) {
            // pass
        }
        else {
            // Call(GenerateCoefficients)
            // def ApplyBoundaryConditions():
            // 界定了第一个节点的温度值，基本上说明数组是从1开始的？
            if (TimeCount <= 3600) {
                phi[1] = TimeCount / 3600;
            }
            else {
                if (TimeCount > 3600 && TimeCount <= 7200) {
                    phi[1] = 2 - TimeCount / 3600;
                }
                else {
                    phi[1] = 0;
                }
            }
            phi[nMax] = 0;

            let BETA = 4/3;

            for (let i = 2; i < nM2 + 1; i++) {
                B[i] = 0;
                A[i] = 0;
                D[i] = 0;
                C[i] = 0;
            }

            //  constant volumetric terms
            for (let i = 2; i < nM2 + 1; i++) {
                let APT = RowCP[i] / TimeStep;
                C[i] = (C[i] + APT * phi[i]) * XCV[i];
                D[i] = APT * XCV[i];
            }

            //  Interior nodes
            for (let i = 2; i < nM3 + 1; i++) {
                A[i] = 2 * Lambda[i] * Lambda[i+1] / (XCV[i] * Lambda[i+1] + XCV[i+1] * Lambda[i]) + small;
                B[i+1] = A[i];
            }
                
            //  left handside boundary condition
            B[2] = BETA * (Lambda[2] / (0.5 * XCV[2])) + small;
            A[1] = B[2];
            B[1] = (BETA - 1) * A[2];
            A[2] = A[2] + B[1];
            C[2] = C[2] + B[2] * phi[1];
            D[2] = D[2] + B[2];
            B[2] = 1;

            //  right hand side boundary condition
            A[nM2] = BETA * (Lambda[nM2] / (0.5 * XCV[nM2])) + small;
            B[nMax] = A[nM2];
            A[nMax] = (BETA - 1) * B[nM2];
            B[nM2] = B[nM2] + A[nMax];
            C[nM2] = C[nM2] + A[nM2] * phi[nMax];
            D[nM2] = D[nM2] + A[nM2];
            A[nM2] = 0;
            for (let i = 2; i < nM2 + 1; i++) {
                D[i] = D[i] + A[i] + B[i];
            }

            // def TDMASolver():
            // Decomposition and forward substitution.
            let PTX = new Array(300).fill(0);
            let QTX = new Array(300).fill(0);

            PTX[1] = 0;
            QTX[1] = phi[1];
            for (let i = 2; i < nM2 + 1; i++) {
                let Denom = D[i] - PTX[i-1] * B[i];
                PTX[i] = A[i] / Denom;
                QTX[i] = (C[i] + B[i] * QTX[i-1]) / Denom;
            }

            // Backsubstitution
            for (let j = nM2; j > 1; j--) {
                phi[j] = QTX[j] + PTX[j] * phi[j+1];
            }
                
            // compute fluxes at the inside and outside faces due to excitation
            // at the exterior surface
            XFlux = A[1] * (phi[1] - phi[2])  + B[1] * (phi[3] - phi[2]);
            YFlux = -(B[nMax] * (phi[nMax] - phi[nM2]) + A[nMax] * (phi[nM3] - phi[nM2]));
            // compute fluxes at the inside surface due to excitation
            // at the interior surface
            ZFlux = A[1] * (phi[1] - phi[2]) + B[1] * (phi[3] - phi[2]);
        }

        //  save the temperatures for external exitation boundary condition
        if (TimeCount === HoursCount * 3600) {
            XResponse[HoursCount] = XFlux;
            YResponse[HoursCount] = YFlux;
            HoursCount = HoursCount + 1;
        }
    }

    // calculate periodic response factor for each construction in the zone
    // from the surface response factors

    let XPRF = new Array(24).fill(0);
    let YPRF = new Array(24).fill(0);
    let ZPRF = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        XPRF[i] = XResponse[i+1];
        YPRF[i] = YResponse[i+1];
        ZPRF[i] = ZResponse[i+1];
        for (let j = 1; j < 8; j++) {
            if (Math.abs(XResponse[i + j * 24]) !== 0) {
                XPRF[i] = XPRF[i] + XResponse[i + j * 24];
            }
            if (Math.abs(YResponse[i + j * 24]) !== 0) {
                YPRF[i] = YPRF[i] + YResponse[i + j * 24];
            }
            if (Math.abs(ZResponse[i + j * 24]) !== 0) {
                ZPRF[i] = ZPRF[i] + ZResponse[i + j * 24];
            }
        }
    }

    let sum = 0;
    YPRF.forEach((number) => {
        sum += number;
    });

    let CTSOut = new Array(24).fill(0);
    for (let j = 0; j < 24; j++) {
        CTSOut[j] = YPRF[j] / sum;
    }

    return CTSOut;
}


function offsetCalc(city, stamp, psi, cloudiness, temps, uWall, uGlazing, ampPeople, ampLight, ampEquip, setTemp, SHGC, ctsf, rts, H, Hsill, WWR, cond, den, cp, thickness) {

    // the maximum depth of the room, as a default value
    const dMax = 10;

    function dotProduct(list1, list2) {
        let product = 0;
        for (let i = 0; i < list1.length; i++) {
            product = product + list1[i]*list2[i];
        }
        return product;
    }

    function loopSigma(inputSeries, timeSeries) {
        function loopBackwards(inputSeries, breakpoint) {
            if (breakpoint > inputSeries.length || breakpoint < 0) {
                console.log('breakpoint out of the series index');
                return inputSeries;
            }
            let loopSeries = []
            for (let i = breakpoint; i >= 0; i--) {
                loopSeries.push(inputSeries[i]);
            }
            for (let i = inputSeries.length - 1; i > breakpoint; i--) {
                loopSeries.push(inputSeries[i]);
            }
            return loopSeries;
        }

        if (inputSeries.length !== timeSeries.length) {
            console.log('data and series are not matched');
            return new Array(timeSeries.length).fill(0);
        }
        else {
            let sigma = new Array(inputSeries.length);
            for (let i = 0; i < inputSeries.length; i++) {
                let recSeries = loopBackwards(inputSeries, i);
                sigma[i] = dotProduct(recSeries, timeSeries);
            }
            return sigma;
        }
    }
    
    // def arraySigma(array):
    //     sigma = 0
    //     for i in range(len(array)):
    //         sigma += array[i]
    //     return sigma

    function HeavisideFilter(array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] < 0) {
                array[i] = 0;
            }
        }
        return array;
    }

    function HeavisideArray(array) {
        for (let i = 0; i < array.length; i++) {
            if (array[i] < 0) {
                array[i] = 0;
            }
            else {
                array[i] = 1;
            }
        }
        return array;
    }

    function HeavisideNum(num) {
        if (num < 0) {
            return 0;
        }
        else {
            return 1;
        }
    }

    let schPeople = [0,0,0,0,0,0,0,0,0.2,0.8,1,1,0.5,0.5,1,1,1,0.5,0.2,0,0,0,0,0];
    let schLight = [0,0,0,0,0,0,0,0,0.5,1,1,1,0.75,0.75,1,1,1,1,0.5,0,0,0,0,0];
    let schEquip = [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.5,0.8,1,1,0.9,0.9,1,1,1,1,0.8,0.5,0.1,0.1,0.1,0.1];
    let CTSFdict = {
        'Blink':[0.99,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        'Curtain':[0.18,0.571,0.198,0.04,0.008,0.002,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        'StudWall':[0.016,0.249,0.373,0.219,0.092,0.034,0.012,0.004,0.001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        'EIFS':[0.005,0.119,0.259,0.229,0.154,0.095,0.057,0.034,0.02,0.012,0.007,0.004,0.002,0.001,0.001,0.001,0,0,0,0,0,0,0,0], 
        'Brick':[0.002,0.048,0.139,0.167,0.149,0.12,0.092,0.07,0.053,0.04,0.03,0.023,0.017,0.013,0.01,0.007,0.005,0.004,0.003,0.002,0.002,0.001,0.001,0.001],
        'Concrete':[0.035,0.034,0.033,0.035,0.038,0.042,0.045,0.047,0.048,0.049,0.049,0.048,0.047,0.046,0.045,0.044,0.043,0.042,0.041,0.04,0.039,0.038,0.037,0.036]
    };

    let RTSsolardict = {
        'Blink':[0.99,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
        'Light':[0.45,0.2,0.11,0.07,0.05,0.03,0.02,0.02,0.01,0.01,0.01,0.01,0.01,0,0,0,0,0,0,0,0,0,0,0], 
        'Medium':[0.29,0.15,0.1,0.07,0.06,0.05,0.04,0.03,0.03,0.03,0.02,0.02,0.02,0.02,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0,0,0], 
        'Heavy':[0.27,0.13,0.07,0.05,0.04,0.04,0.03,0.03,0.03,0.03,0.03,0.03,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.01,0.01]
    };

    let RTSmassdict = {
        'Blink':[0.99,0.01,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], 
        'Light':[0.43,0.19,0.11,0.07,0.05,0.03,0.03,0.02,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0,0,0,0,0,0,0,0,0], 
        'Medium':[0.33,0.16,0.1,0.07,0.05,0.04,0.03,0.03,0.02,0.02,0.02,0.02,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0.01,0], 
        'Heavy':[0.25,0.09,0.06,0.05,0.05,0.04,0.04,0.04,0.03,0.03,0.03,0.03,0.03,0.03,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02,0.02]
    };

    // Params formation
    let cityDict = {
        'Shanghai':[121.45,31.4], 
        'Harbin':[126.77,45.75], 
        'Beijing':[116.47,39.80], 
        'Guangzhou':[113.33,23.17], 
        'Lhasa':[91.13,29.67], 
        'Urumqi':[87.65,43.78], 
        'Lanzhou':[103.88,36.5], 
        'Kunming':[102.68,25.02]
    };
    let longitude = cityDict[city][0];
    let latitude = cityDict[city][1];

    let timezone = 8

    //date = date# if date else '2020-12-21'
    //psi = psi# if psi else 180
    // outside srf resistance 0.044 / inside vertex srf resistance 0.120
    let uWall_ = 1/(1/uWall+0.164);

    let RTSsolar = RTSsolardict[rts];
    let RTSmass = RTSmassdict[rts];
    let CTSFwall = CTSFdict[ctsf];
    if (ctsf === 'Customize!') {
        CTSFwall = ctsfCalc(cond, den, cp, thickness, cond/thickness, 3);
    }

    // import epw information
    let date = new Date(Date.parse(stamp));
    let num_day = dayOfYear(date);

    // only use sinusoid temperature
    let seriesTout = temps;

    // Calculate load from solar beam
    let azimuths = new Array(24);
    let altitudes = new Array(24);
    for (let i = 0; i < 24; i++) {
        [altitudes[i], azimuths[i]] = solarCalc(latitude, longitude, timezone, stamp+' '+i.toString()+':00:00');
    }
    let theta_cos = new Array(24);
    let phi_rad = new Array(24);
    for (let i = 0; i < 24; i++) {
        let alpha_rad = altitudes[i] / 180 * Math.PI;
        //phi_rad[i] = (Math.abs(azimuths[i]-psi) * HeavisideNum(90 - Math.abs(azimuths[i]-psi))
        //    + 90 * HeavisideNum(Math.abs(azimuths[i]-psi) - 90)
        //    ) / 180 * Math.PI;
        let delta_phi = Math.abs(azimuths[i] - psi) - 90;
        phi_rad[i] = (90 - Math.abs(delta_phi) * HeavisideNum(-delta_phi)) / 180 * Math.PI;
        theta_cos[i] = Math.cos(alpha_rad)*Math.cos(phi_rad[i]);
        
    }
    // use default sky conditions apart from EPW
    let eBeam = new Array(24).fill(0);
    let eDiffuse = new Array(24).fill(0);
    let eTerrestrial = 1367,
        ab = 0.64967, 
        ad = 0.2044,
        tb = 0.38,
        td = 2.5;
    // ab = 1.454 - 0.406*tb - 0.268*td + 0.021*tb*td
    // ad = 0.507 + 0.205*tb - 0.08*td - 0.19 *tb*td
    let E0 = eTerrestrial * (1 + 0.033 * Math.cos((num_day-3)*360/365));
    for (let i = 0; i < 24; i++) {
        let islit = HeavisideNum(altitudes[i]);
        let m = 1 / ( Math.sin((islit * altitudes[i]) / 180 * Math.PI) + 0.50572*Math.pow((6.07995+(islit * altitudes[i]) / 180 * Math.PI),-1.6364));
        eBeam[i] = (E0 * Math.exp(-tb*Math.pow(m,ab)) * (1-cloudiness) * islit);
        eDiffuse[i] = (E0 * Math.exp(-td*Math.pow(m,ad)) * (1-0.8*cloudiness) * islit);
    }
    
    let Ys = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        if (altitudes[i] < -20) {
        }
        else {
            if (theta_cos[i] < 0.2) {
                Ys[i] = 0.45;
            }
            else {
                Ys[i] = 0.55 + 0.437 * theta_cos[i] + 0.313 * theta_cos[i] * theta_cos[i];
            }
        }
    }
    let qDiffuse = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        if (altitudes[i] > -20) {
            qDiffuse[i] = eDiffuse[i] * Ys[i];
        }
    }

    let qBeam = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        if (altitudes[i] > 0) {
            qBeam[i] = eBeam[i] * theta_cos[i];
        }
    }
    console.log(eBeam, qBeam);
    // Calculate load from heat emission
    //let seriesTsol = [];
    // for (i = 0; i < seriesTout.length; i++) {
    //     let deltaR = Math.abs(5.67e-8 * Math.pow(273.15 + seriesTout[i], 4) - Qbeam[i] - Qdiffuse[i]);
    //     let Tsol = seriesTout[i] + 0.15*(Qbeam[i] + Qdiffuse[i]) + deltaR *0.5 /4;
    //     seriesTsol.push(Tsol);
    // }
    // or use this
    let seriesTsol = seriesTout;
    // let qTotal = new Array(24).fill(0);
    // for (let i = 0; i < 24; i++) {
    //     qTotal[i] = qBeam[i] + qDiffuse[i];
    // }

    let tempDiff = seriesTsol.map(element => setTemp - element);
    // this is the beam radiation per vertical wall area, same as the diffuse radiation value
    let loadSolar = loopSigma(qBeam, RTSsolar);
    let loadWall = loopSigma(tempDiff, CTSFwall).map(element => element * uWall_);
    // Calculate load from internal source
    let fracRad = 0.4;
    let qConv = new Array(24).fill(0);
    let qRad = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        // will people heat load participates in the radiation lag?
        qConv[i] = (schPeople[i]*ampPeople + schLight[i]*ampLight) * (1-fracRad) + schEquip[i]*ampEquip;
        qRad[i] = (schPeople[i]*ampPeople + schLight[i]*ampLight) * fracRad + qDiffuse[i] * H * WWR / dMax;
    }
    let loadMass = loopSigma(qRad, RTSmass);
    let alpha_rad = new Array(24).fill(0.001);
    let loadStructure = new Array(24).fill(0);

    for (let i = 0; i < 24; i++) {
        loadMass[i] = loadMass[i] + qConv[i];
        if (altitudes[i] > 0) {
            alpha_rad[i] = altitudes[i] /180 * Math.PI;
        }
        loadStructure[i] = (WWR*uGlazing*(setTemp-seriesTout[i]) + (1-WWR)*loadWall[i]) * H;
    }

    let Dmin = new Array(24).fill(0);
    let Dmax = new Array(24).fill(0);
    for (let i = 0; i < 24; i++) {
        if (alpha_rad[i] > 0 && phi_rad[i] > 0) {
            Dmin[i] = Hsill / Math.tan(alpha_rad[i]) * Math.cos(phi_rad[i]);
            Dmax[i] = (Hsill + H * WWR) / Math.tan(alpha_rad[i]) * Math.cos(phi_rad[i]);
            Dmax[i] = Dmax[i] - Dmin[i];
            if (Dmin[i] < 0.01) {Dmin[i] = 0}
            if (Dmax[i] < 0.01) {Dmax[i] = 0}
        }
    }
    console.log(Dmin, Dmax);

    let distances = new Array(24).fill(9999);
    for (let i = 0; i < 24; i++) {
        if (Dmin[i] > 0) {
            // <--- d ---- | --- solar --- | --- unlit --- | exterior
            if (loadStructure[i] > Dmin[i] * loadMass[i] + loadSolar[i] * SHGC * H * WWR) {
                distances[i] = (loadStructure[i] - loadSolar[i] * SHGC * H * WWR) / loadMass[i];
            }
            // -- | - solar - <- d -- | --- unlit --- | exterior
            else {
                if (loadStructure[i] > Dmin[i] * loadMass[i]) {
                    distances[i] = (loadStructure[i] + Dmin[i] * loadSolar[i] * SHGC * H * WWR / Dmax[i]) / 
                        (loadMass[i] + loadSolar[i] * SHGC * H * WWR / Dmax[i]);
                }
                // -- | --- solar --- | - unlit -<- d -- | exterior
                else {
                    distances[i] = loadStructure[i] / loadMass[i];
                }
            }
        }
        // -- | --- solar --- | - unlit -<- d -- | exterior
        else {
            distances[i] = loadStructure[i] / loadMass[i];
        }
    }

    // it seems that I presumed a 10-meter indoor depth here...
    // if the internal heat emission per meter is not 0, then it can be canceled off by the loadStructure
    let distances_mix = new Array(24).fill(9999);
    for (let i = 0; i < 24; i++) {
        if (loadMass[i] + loadSolar[i] * SHGC * H * WWR / dMax !== 0) {
            // presuming a complete mix that the solar heat gain distributes evenly in the 10-meter depth
            distances_mix[i] = loadStructure[i] / (loadMass[i] + loadSolar[i] * SHGC * H * WWR / dMax);
        }
    }

    
    let Diso = HeavisideFilter(distances);
    let Dmix = HeavisideFilter(distances_mix);
    let Diso_ = Diso.map(element => Math.round(element * 10)/10); // round to 0.1
    let Dmix_ = Dmix.map(element => Math.round(element * 10)/10);

    let loadMass_sigma = 0,
        loadSolar_sigma = 0,
        loadStructure_sigma = 0;
    loadMass.forEach((number) => { loadMass_sigma += number; });
    loadSolar.forEach((number) => { loadSolar_sigma += number * SHGC * H * WWR; });
    loadStructure.forEach((number) => { loadStructure_sigma += number; });

    let Davg_24 = 9999;
    // for 0-24 hours' full heat mixing, the cancel-off boundary
    if (loadMass_sigma + loadSolar_sigma !== 0) {
            Davg_24 = loadStructure_sigma / (loadMass_sigma + loadSolar_sigma / dMax);
        }

    let loadStructure_sigma_part = 0,
        loadMass_sigma_part = 0,
        loadSolar_sigma_part = 0;
    // for 10 working hours, the cancel-off boundary based on the fully mixed indoor environment
    for (let i = 9; i < 19; i++) {
        loadStructure_sigma_part += loadStructure[i];
        loadMass_sigma_part += loadMass[i];
        loadSolar_sigma_part += loadSolar[i] * SHGC * H * WWR;
    }
    let Davg_10 = loadStructure_sigma_part / (loadMass_sigma_part + loadSolar_sigma_part / dMax);

    return [Diso_, Dmix_, Davg_24, Davg_10, Dmax, Dmin]
}

$(function() {
    $("#ctsfselector").change(function() {
        if ($(this).val() == 'Customize!') {
            $("#materialpopout").slideDown(200);
        }
        else{
            $("#materialpopout").slideUp(200);
        }
    });

    $("#radtoggle").change(function() {
        if (!$(this).attr("checked")) {
            $(this).attr("checked", true);
            $("input[name='inp_clo']").attr("disabled", true);
        }
        else{
            $(this).removeAttr("checked");
            $("input[name='inp_clo']").removeAttr("disabled");
        }
    });

    $("#temptoggle").change(function() {
        if (!$(this).attr("checked")) {
            $(this).attr("checked", true);
            $("input[name='inp_temp1']").attr("disabled", true);
            $("input[name='inp_temp2']").attr("disabled", true);
        }
        else{
            $(this).removeAttr("checked");
            $("input[name='inp_temp1']").removeAttr("disabled");
            $("input[name='inp_temp2']").removeAttr("disabled");
        }
    });
})