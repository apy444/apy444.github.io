// ---- width and height of the chart
// const H = window.screen.availHeight;
const H = window.innerHeight;

// const w = 1000;
// const h = 400;
const h = Math.min(H * 0.6, 400);
const w = h * 2.5;

//  ----   padding   ------
const pLeft = 80;
const pRight = 120;
const pTop = 60;
const pBottom = 60;

let dataLook;
let ratingsLook;
let countsLook;

// IMPORT DATA and CREATE CHART
d3.dsv(",", "average-rating.csv", function (d) {
    d.rating = Math.floor(d.average_rating);
    delete d.average_rating;
    d.year = +d.year;
    d.users_rated = +d.users_rated;
    return d;
}).then((data) => {
    //------------------------------------
    //      CREATING THE DATASTRUCTURE
    //------------------------------------

    const years = [2015, 2016, 2017, 2018, 2019];
    const ratings = [
        ...Array(Math.max(...data.map((d) => d.rating)) + 1).keys(),
    ];

    let counts = [];
    years.forEach((y) => {
        let byYear = { year: y, values: [] };
        ratings.forEach((r) => {
            let byRating = {
                rating: r,
                count: data
                    .filter((d) => d.year === y)
                    .filter((d) => d.rating === r).length,
                top5: data
                    .filter((d) => d.year === y)
                    .filter((d) => d.rating === r)
                    .sort((a, b) => b.users_rated - a.users_rated)
                    .slice(0, 5),
            };
            byYear.values.push(byRating);
        });
        counts.push(byYear);
    });

    // find the maximum of the count values
    const maxCount = Math.max(
        ...counts
            .map((d) => d.values)
            .flat()
            .map((d) => d.count)
    );

    dataLook = data;
    console.log(dataLook);

    countsLook = counts;
    console.log(countsLook);

    // ratingsLook = ratings;
    // console.log(ratingsLook);

    //------------------------------------
    //         LINECHART ELEMENTS
    //------------------------------------

    // SCALES
    const xScale = d3
        .scaleLinear()
        .domain([0, d3.max(ratings)])
        .range([pLeft, w - pRight]);

    const yScale = d3
        .scaleLinear()
        .domain([0, maxCount])
        .range([h - pBottom, pTop]);

    const colors = ["#eaac8b", "#e56b6f", "#b56576", "#6d597a", "#355070"];
    // const colors = d3.schemeSet2;
    const colorScale = d3.scaleOrdinal(colors);

    // X AXIS
    const xAxis = d3.axisBottom().scale(xScale);

    //create yAxis variable
    const yAxis = d3.axisLeft().scale(yScale).ticks(10);

    // create line variable
    const line = d3
        .line()
        .x(function (v) {
            return xScale(v.rating);
        })
        .y(function (v) {
            return yScale(v.count);
        });

    //------------------------------------
    //             LINECHART 1
    //------------------------------------

    // create SVG element
    const svg1 = d3
        .select("#linechart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

    svg1.append("g") //create x-axis
        .attr("class", "axis")
        .attr("transform", "translate(0," + (h - pBottom) + ")")
        .call(xAxis);

    svg1.append("g") //create y-axis
        .attr("class", "axis")
        .attr("transform", "translate(" + pLeft + ", 0)")
        .call(yAxis);

    //X-LABEL
    svg1.append("text") //create x label
        .attr("class", "x-label")
        .attr("x", (w - pLeft - pRight) / 2 + pLeft)
        .attr("y", h - 20)
        // .attr("text-anchor", "middle")

        .text("Rating");

    // Y-LABEL
    svg1.append("text") //create y label
        .attr("class", "y-label")
        .attr("y", pLeft / 4) //swap with x coord bc of rotation
        .attr("x", -h / 2) //swap with y coord and multiply by (-1)
        .attr("transform", `translate(0, ${h / 2})`)
        .attr("transform", "rotate(-90)")
        .text("Count");

    // LEGEND:
    legendElem = svg1
        .append("g")
        .attr("class", "legend")
        .selectAll("g")
        .data(years)
        .enter()
        .append("g")
        .attr("transform", (d, i) => {
            const x = w - pRight;
            const y = pTop + (i + 1) * 20;
            return `translate(${x}, ${y})`;
        });
    legendElem //add circles
        .append("circle")
        .attr("transform", "translate(-40, -1)")
        .attr("r", 4)
        .style("fill", (y) => colorScale(y));
    legendElem //ad text
        .append("text")
        .attr("class", "legend")
        .text((d) => d);

    //TITLE
    svg1.append("text") //add title on the top
        .attr("x", (w - pLeft - pRight) / 2 + pLeft)
        .attr("y", pTop / 2)
        .attr("class", "title")
        .text("Board games by Rating 2015-2019")
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle");

    //LINES
    svg1.selectAll(".lines") //add lines
        .data(counts)
        .enter()
        .append("g")
        .attr("class", "lines")
        .append("path")
        .attr("d", (d) => line(d.values))
        .style("stroke", (d) => colorScale(d.year));

    //Add Circles
    counts.forEach((yearCount) => {
        elems = svg1
            .append("g")
            .attr("class", "circles")
            .selectAll("g")
            .data(yearCount.values)
            .enter()
            .append("g")
            .attr("transform", (d) => {
                const x = xScale(d.rating);
                const y = yScale(d.count);
                return `translate(${x}, ${y})`;
            });

        elems
            .append("circle")
            .attr("r", 4)

            .style("fill", colorScale(yearCount.year))
            .on("mouseover", function (d) {
                d3.select(this).attr("r", 8);
                if (d.top5.length > 0) {
                    drawBarChart(d.top5);
                }
            })
            .on("mouseout", function () {
                d3.select(this).attr("r", 4);
                d3.select("#popup").remove();
            });
    });

    // Username
    svg1.append("text")
        .attr("class", "username")
        .attr("x", (w - pLeft - pRight) / 2 + pLeft)
        .attr("y", pTop)
        .text("akoltai3")
        .style("fill", colorScale(2016));

    //------------------------------------
    //             BARCHART
    //------------------------------------

    const drawBarChart = (data) => {
        // console.log(data);

        // const barHeight = 40;
        const barHeight = (h * 0.6 - pTop - pBottom) / 5;
        const newh = pTop + data.length * barHeight + pBottom;

        const svg2 = d3
            .select("#barchart")
            .append("svg")
            .attr("id", "popup")
            .attr("width", w)
            .attr("height", newh);

        //X SCALE
        const xScale = d3
            .scaleLinear()
            .domain([0, d3.max(data.map((d) => d.users_rated))])
            .range([pLeft * 3, w - pRight - pLeft * 2]);

        //X AXIS
        const xAxis = d3.axisBottom().scale(xScale).ticks(7);
        // .tickSize(-data.length * barHeight);
        svg2.append("g") //create x-axis
            .attr("class", "bar-axis-x")
            .attr("transform", `translate(0, ${newh - pBottom})`)
            .call(xAxis);
        d3.selectAll(".bar-axis-x .tick line").attr(
            "y2",
            -data.length * barHeight
        );

        //Y SCALE
        const yScale = d3
            .scaleBand()
            .domain(data.map((d) => d.name.slice(0, 10)))
            // .attr("class", "bar-gamenames")
            .range([pTop, newh - pBottom])
            .paddingInner(0.2);

        //Y AXIS
        const yAxis = d3.axisLeft().scale(yScale);
        svg2.append("g") //create y-axis
            .attr("class", "bar-axis bar-gamenames")
            .attr("transform", `translate(${pLeft * 3}, 0)`)
            .call(yAxis);

        // BARS - RECT SVG elements
        svg2.append("g")
            .attr("class", "bars")
            .selectAll(".bars")
            .data(data)
            .enter()
            .append("rect")
            .attr("x", xScale(0))
            .attr("y", (d, i) => yScale(d.name.slice(0, 10)))
            .attr("width", (d) => xScale(d.users_rated) - xScale(0))
            .attr("height", yScale.bandwidth())
            // .attr("fill", (d) => colorScale(d.year))
            .attr("fill", colorScale(2015))
            .attr("opacity", 0.8);

        // TITLE
        svg2.append("text")
            .attr("class", "bar-title")
            .attr("x", (w - pLeft - pRight) / 2 + pLeft)
            .attr("y", pTop / 2)
            .text(
                `Top 5 most rated games for year ${data[0].year} with rating ${data[0].rating}`
            );

        //X-Label
        svg2.append("text")
            .attr("class", "x-label")
            .attr("x", (w - pLeft - pRight) / 2 + pLeft)
            .attr("y", newh - 20)
            .text("Number of users");

        //Y-Label
        svg2.append("text")
            .attr("class", "y-label")
            .attr("y", pLeft / 2 + pLeft) //swap with x coord bc of rotation
            .attr("x", -newh / 2) //swap with y coord and multiply by (-1)
            .attr("transform", `translate(0, ${newh / 2})`)
            .attr("transform", "rotate(-90)")
            .text("Games");
    };
});
