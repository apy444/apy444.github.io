const menu = document.getElementById("menu");
//--------------------------------------
//     Display parameters, SVG element
//--------------------------------------

const w = 1200;
const h = 500;

const svg = d3
    .select("#choropleth")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

svg.append("text")
    .attr("class", "username")
    .attr("x", w / 2)
    .attr("y", h)
    .text("akoltai3");

//----------------------------------------
//    Function: Merge gameData into world
//----------------------------------------

const merge = (world, data, selectedGame) => {
    let gameData = data.filter((d) => d.Game === selectedGame);
    world.features.forEach((w) => {
        const country = w.properties.name;
        const values = gameData.filter((d) => d.Country === country)[0];
        w.properties.game = selectedGame;
        if (values) {
            w.properties.avg_rating = values.Average_Rating;
            w.properties.num_users = values.Num_Users;
        }
    });
    return world;
};

//--------------------------------------
//              Import Data
//--------------------------------------

let dataLook;
let mapLook;
let selectedGameLook;
let tipLook;

const promise1 = d3.csv("ratings-by-country.csv", (d) => {
    d.Average_Rating = +d["Average Rating"];
    d.Num_Users = +d["Number of Users"];
    delete d["Average Rating"];
    delete d["Number of Users"];
    return d;
});

const promise2 = d3.json("world_countries.json");

Promise.all([promise1, promise2]).then((values) => {
    const data = values[0];
    const world = values[1];

    //------------------------------------
    //    Create DropDown Menu
    //------------------------------------

    const games = [...new Set(data.map((d) => d.Game))].sort();
    games.forEach((game) => {
        const elem = document.createElement("option");
        elem.textContent = game;
        elem.setAttribute("value", game);
        menu.insertAdjacentElement("beforeend", elem);
    });
    menu.selectedIndex = 25;

    // Draw Chart with the default game
    drawChoropleth(merge(world, data, menu.value));

    //Update chart if selection changes
    d3.select("#menu").on("change", function () {
        let newGame = d3.select(this).property("value");
        // document.select("svg").removeChild("g");
        drawChoropleth(merge(world, data, newGame));
    });
});

//--------------------------------------
//            Draw Choropleth
//--------------------------------------

let ratingLook;
const drawChoropleth = (world) => {
    // Remove Antarctica
    world.features = world.features.filter((d) => d.id !== "ATA");
    // Look into the data --------------------
    worldLook = world;
    console.log(worldLook);
    //-----------------------------------------

    const avgRatingArray = world.features
        .map((d) => d.properties.avg_rating)
        .filter((d) => d);

    ratingLook = avgRatingArray;
    console.log(ratingLook);
    const projection = d3
        // .geoEquirectangular()
        // .translate([w / 2, h / 2])
        .geoMercator()
        .translate([w / 2, h / 1.5])
        .scale(140);

    const path = d3.geoPath().projection(projection);

    const colorScale = d3
        .scaleQuantile()
        .domain(avgRatingArray)
        .range(["#BDD3E6", "#81A5C4", "#4476A3", "#084881"]);

    const format_ths = d3.format(",");
    const format_dec = d3.format(".2f");

    //------------------------------
    //   CREATE TIP
    //----------------------------------

    var tip = d3
        .tip()
        .attr("class", "d3-tip")
        .html((d) => {
            rating =
                d.properties.avg_rating === undefined
                    ? "N/A"
                    : format_dec(d.properties.avg_rating);
            users =
                d.properties.avg_rating === undefined
                    ? "N/A"
                    : format_ths(d.properties.num_users);
            return (
                "<strong>Country: </strong><span>" +
                d.properties.name +
                "</span><br><strong>Game: </strong><span>" +
                d.properties.game +
                "</span><br><strong>Avg Rating: </strong><span>" +
                rating +
                "</span><br><strong>Number of Users: </strong><span>" +
                users
            );
        });

    svg.call(tip);

    //------------------------------------
    //      Let's draw the map
    //------------------------------------
    svg.selectAll("g").remove();

    let countryOn;
    svg.append("g")
        .attr("class", "map")
        .selectAll("path")
        .data(world.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", (d) => {
            c = d.properties.avg_rating
                ? colorScale(d.properties.avg_rating)
                : "#bbbbbb";
            return c;
        })
        .on("mouseover", function (d) {
            tip.show(d)
                .style("top", `${d3.event.pageY - 100}px`)
                .style("left", `${d3.event.pageX}px`);
            countryOn = d3.select(this);
            countryOn.classed("focused", true);
        })

        .on("mouseout", (d) => {
            tip.hide(d);
            countryOn.classed("focused", false);
        });

    //-------------------------
    //    Add Legend
    //-------------------------

    svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20,20)");

    let colorLegend = d3
        .legendColor()
        .labelFormat(d3.format(".2f"))
        // .useClass(true)
        .scale(colorScale);

    svg.select(".legend").call(colorLegend);
};
