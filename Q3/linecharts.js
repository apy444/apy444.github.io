const w = 1000;
const h = 500;
//  ----   padding   ------
const pLeft = 80;
const pRight = 120;
const pTop = 60;
const pBottom = 60;

const parseTime = d3.timeParse("%Y-%m-%d");
const formatTime = d3.timeFormat("%b %y");

let dataset;
let cols;
let gameR;
let gameC;
let gamesD;

// IMPORT DATA and CREATE CHART
d3.dsv(",", "boardgame_ratings.csv", function (d) {
    d.date = parseTime(d.date);
    return d;
}).then((data) => {
    dataset = data;
    console.log(dataset);

    // GAME NAMES
    const games = [];
    const colnames = data.columns.slice(1);
    for (let word of colnames) {
        let w = word.split("=")[0];
        if (!games.includes(w)) {
            games.push(w);
        }
    }

    // GAME COUNTS AND RANKS DATA
    const gamesData = games.map(function (id) {
        return {
            id: id,
            values: data.map((d) => {
                return {
                    date: d.date,
                    count: +d[`${id}=count`],
                    rank: +d[`${id}=rank`],
                };
            }),
        };
    });

    gamesD = gamesData;
    console.log(gamesD);

    //------------------------------------
    //         LINECHART ELEMENTS
    //------------------------------------

    // SCALES
    const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.date))
        .range([pLeft, w - pRight]);

    const yScale = d3
        .scaleLinear()
        .domain([
            0,
            d3.max(gamesData, (d) => {
                return d.values.slice(-1)[0].count;
            }),
        ])
        .range([h - pBottom, pTop]);

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // X AXIS
    const xAxis = d3
        .axisBottom()
        .scale(xScale)
        // .ticks(16)
        .tickFormat((d) => formatTime(d));

    // FUNCTION: DRAW BASIC LINECHART
    const drawChart = (svgElem, yScaler, title) => {
        //create yAxis variable
        const yAxis = d3.axisLeft().scale(yScaler).ticks(10);

        //create line variable
        const line = d3
            .line()
            .x(function (v) {
                return xScale(v.date);
            })
            .y(function (v) {
                return yScaler(v.count);
            });

        svgElem //create x-axis
            .append("g")
            .attr("class", "axis x_axis")
            .attr("transform", "translate(0," + (h - pBottom) + ")")
            .call(xAxis);

        svgElem //create y-axis
            .append("g")
            .attr("class", "axis y_axis")
            .attr("transform", "translate(" + pLeft + ", 0)")
            .call(yAxis);

        svgElem //create x label
            .append("text")
            .attr("x", w / 2)
            .attr("y", h - 20)
            .attr("text-anchor", "middle")
            .attr("id", "x_axis_label")
            .text("Month");

        svgElem //create y label
            .append("text")
            .attr("id", "y_axis_label")
            .attr("y", pLeft / 4) //swap with x coord bc of rotation
            .attr("x", -h / 2) //swap with y coord and multiply by (-1)
            .attr("transform", "translate(0," + h / 2 + ")")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "hanging")
            .attr("transform", "rotate(-90)")
            .text("Num of Ratings");

        svgElem //add boardgame names at the end
            .append("g")
            .attr("class", "names")
            .selectAll(".names")
            .data(gamesData)
            .enter()
            .append("text")
            // .attr("class", "names")
            .attr("x", w - pRight + 10)
            .attr("y", (d) => {
                return yScaler(d.values.slice(-1)[0].count);
            })
            .text((d) => d.id)
            .style("dominant-baseline", "middle")
            .style("fill", (d) => colorScale(d.id));

        svgElem //add title on the top
            .append("text")
            .attr("x", w / 2)
            .attr("y", pTop / 2)
            .attr("class", "title")
            .text(title)
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle");

        svgElem //add lines
            .selectAll(".lines")
            .data(gamesData)
            .enter()
            .append("g")
            .attr("class", "lines")
            .append("path")
            .attr("d", (d) => line(d.values))
            .style("stroke", (d) => colorScale(d.id));
    };

    const addCircles = (svgElem, yScaler) => {
        for (let i of [0, 2, 3, 4]) {
            elems = svgElem
                .append("g")
                .attr("class", "circles")
                .selectAll("g")
                .data(
                    gamesData[i].values.filter((d, i) => {
                        return i % 3 === 2;
                    })
                )
                .enter()
                .append("g")
                .attr("transform", (d) => {
                    const x = xScale(d.date);
                    const y = yScaler(d.count + 1);
                    return `translate(${x}, ${y})`;
                });

            elems
                .append("circle")
                .attr("r", 8)
                .style("fill", (d) => {
                    return colorScale(gamesData[i].id);
                });

            elems
                .append("text")
                .attr("class", "ranklabels")
                .text((d) => d.rank);
        }
        // BoardGameGeek Symbol
        symbol = svgElem.append("g").attr("class", "symbol");
        symbol
            .append("circle")
            .attr("cx", w - pLeft / 2 - 10)
            .attr("cy", h - pBottom - 12)
            .attr("r", 8)
            .style("fill", "black");
        symbol
            .append("text")
            .attr("class", "symbol")
            .attr("x", w - pLeft / 2 - 10)
            .attr("y", h - pBottom - 12)
            .text("rank");
        symbol
            .append("text")
            .attr("x", w - pLeft / 2 - 10)
            .attr("y", h - pBottom)
            .text("BoardGameGeek Rank")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "hanging")
            .style("font-size", "8px");
    };

    //------------------------------------
    //             LINECHART 1
    //------------------------------------

    const svg1 = d3
        .select("#chart1")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    drawChart(svg1, yScale, "Number of Ratings 2016-2020");

    //------------------------------------
    //             LINECHART 2
    //------------------------------------
    const svg2 = d3
        .select("#chart2")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    drawChart(svg2, yScale, "Number of Ratings 2016-2020 with Rankings");

    addCircles(svg2, yScale);

    //------------------------------------
    //             LINECHART 3
    //------------------------------------
    const svg3 = d3
        .select("#chart3")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    const sqrtScale = d3
        .scaleSqrt()
        .domain([
            0,
            d3.max(gamesData, (d) => {
                return d.values.slice(-1)[0].count;
            }),
        ])
        .range([h - pBottom, pTop]);

    drawChart(
        svg3,
        sqrtScale,
        "Number of Ratings 2016-2020 (Square root Scale)"
    );

    addCircles(svg3, sqrtScale);

    //------------------------------------
    //             LINECHART 4
    //------------------------------------
    const svg4 = d3
        .select("#chart4")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    const logScale = d3
        .scaleLog()
        .domain([
            1,
            d3.max(gamesData, (d) => {
                return d.values.slice(-1)[0].count;
            }),
        ])
        .range([h - pBottom, pTop]);

    drawChart(svg4, logScale, "Number of Ratings 2016-2020 (Log Scale)");

    addCircles(svg4, logScale);

    svg4.append("text")
        .attr("class", "username")
        .attr("x", w - 10)
        .attr("y", h - 10)
        .text("akoltai3");
});
