var lastClick = null;

var margin = {top: 175, right: 0, bottom: 0, left: 175},
    width = 600,
    height = 600;

var dmargin = {top: 0, right: 50, bottom: 100, left: 0},
    dwidth = 350,
    dheight = 125;

var x = d3.scale.ordinal().rangeBands([0, width]),
    z = d3.scale.linear().domain([0, 15]).clamp(true),
    c = d3.scale.category10().domain(d3.range(10));

var svg = d3.select("#co-viz").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var allFirms = [];

var catxScale = d3.scale.ordinal().rangeRoundBands([0, dwidth], .2);
var catyScale = d3.scale.linear().range([dheight, 0]);

var catxAxis = d3.svg.axis()
.scale(catxScale)
.orient("bottom");

var catyAxis = d3.svg.axis()
.scale(catyScale)
.orient("right");

var catsvg = d3.select("#cat-viz").append("svg")
.attr("width", dwidth + dmargin.left + dmargin.right)
.attr("height", dheight + dmargin.top + dmargin.bottom)
.append("g")
.attr("class", "cat");

var linesvg = d3.select("#line-viz").append("svg")
.attr("width", dwidth + dmargin.left + dmargin.right)
.attr("height", dheight + dmargin.top + dmargin.bottom)
.append("g")
.attr("class", "year")

var linexScale = d3.scale.linear().range([0, dwidth]);

var lineyScale = d3.scale.linear().range([dheight,0]);

var linexAxis = d3.svg.axis()
.scale(linexScale)
.orient("bottom")
.tickFormat(d3.format("04d"))

var lineyAxis = d3.svg.axis()
.scale(lineyScale)
.orient("right")

var line = d3.svg.line()
.x(function(d,i){return linexScale(d.year);})
.y(function(d){return lineyScale(d.val);});

var mapsvg = d3.select("#map-viz").append("svg")
.attr("width", dwidth + dmargin.left + dmargin.right)
.attr("height", dheight + dmargin.top + dmargin.bottom)
.append("g")
.attr("transform", "translate(" + 0 + "," + 30 + ")")

var projection = d3.geo.albersUsa().scale(400).translate([dwidth/2 , dheight/2]);//.precision(.1);
var path = d3.geo.path().projection(projection);

var heatmap = d3.scale.linear();

d3.json("../../data/allFirms_2014-04-07-01-06-44_out.json", function(firms) {
  firms.forEach(function(d){
    if (d['name'] == "Start-Up Chile") {
      d['time'][2010] = d['time'][2010]/2
      d['time'][2011] = d['time'][2011]/2
      d['time'][2012] = d['time'][2012]/2
      d['time'][2013] = d['time'][2013]/2
      d['time'][2014] = d['time'][2014]/2
    }
  });


  var indices = {}
  allFirms = firms;
  firms.forEach(function(d){
    indices[d.permalink] = d.index;
  });

  // console.log(indices);

  catxScale.domain(d3.keys(firms[0]['cat']).map(function(d) {
    return d.split("_").join(" ");
  }));

  catyScale.domain([0, d3.max(firms.map(function(d) {
    return d3.max(d3.values(d['cat']));}))
  ]);

  //update domains for line scales
  linexScale.domain([d3.min(firms.map(function(d){
      return d3.min(d3.keys(d.time))
    })),2013])
  lineyScale.domain([d3.min(firms.map(function(d){
    return d3.min(d3.keys(d.time).map(function(e){return d.time[e]}))
  })),d3.max(firms.map(function(d){
    return d3.max(d3.keys(d.time).map(function(e){return d.time[e]}))
  }))])

  heatmap.domain([0, 15])
  .interpolate(d3.interpolateRgb)
  // .range(["#fff", "steelblue"])
  .clamp(true);



  makebyCat();
  lineGraph();
  createMap();

  var nodes = firms.map(function(d) {
    var group = null;
    var early = d.round['seed'] + d.round['a'];
    var mid = d.round['b'] + d.round['c'];
    var late = d.round['d+'] + d.round['other'];
    if (early > mid && early > late) {
      group = 1;
    } else if (mid > early && mid > late) {
      group = 2;
    } else {
      group = 3;
    }

    return {'name':d.name, 
            'group':group,
            'permalink':d.permalink,
            'index':d.index,
            'count':0}
  });

  var matrix = [];
  var n = firms.length;

  nodes.forEach(function(node, i) {
    matrix[i] = d3.range(n).map(function(j) { return {x: j, y: i, z: 0.0001}; });
  });

  

  // Convert links to matrix; count character occurrences.
  firms.forEach(function(links) {
    d3.keys(links.cooc).forEach(function(link) {
      matrix[links.index][indices[link]].z += links['cooc'][link];
      nodes[links.index].count += links['cooc'][link];
    });
  });

  // firms.forEach(function(links) {
  //   d3.keys(links.cooc).forEach(function(link) {
  //     matrix[links.index][indices[link]].z = Math.floor(matrix[links.index][indices[link]].z);
  //     nodes[links.index].count = Math.floor(nodes[links.index].count);
  //   });
  // });

   

  // Precompute the orders.
  var orders = {
    name: d3.range(n).sort(function(a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
    count: d3.range(n).sort(function(a, b) { return nodes[b].count - nodes[a].count; }),
    group: d3.range(n).sort(function(a, b) { return nodes[b].group - nodes[a].group; })
  };

  // The default sort order.
  x.domain(orders.name);

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height);

  var row = svg.selectAll(".row")
      .data(matrix)
    .enter().append("g")
      .attr("class", function(d, i) {return "row" + " " + nodes[i].permalink + " " + i})
      .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .each(row);

  row.append("line")
      .attr("x2", width);

  row.append("text")
      .attr("x", -6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "end")
      .text(function(d, i) { return nodes[i].name; })
      .on("click", function(d, i) { window.open("http://www.crunchbase.com/organization/"+nodes[i].permalink,'_blank') })
      .attr("class", "name");
      // .on("mouseover", mouseoverFirm)
      // .on("mouseout", mouseoutFirm);

  var column = svg.selectAll(".column")
      .data(matrix)
    .enter().append("g")
      .attr("class", function(d, i) {return "column" + " " + nodes[i].permalink + " " +i})
      .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; })

  column.append("line")
      .attr("x1", -width);

  column.append("text")
      .attr("x", 6)
      .attr("y", x.rangeBand() / 2)
      .attr("dy", ".32em")
      .attr("text-anchor", "start")
      .text(function(d, i) { return nodes[i].name; })
      .on("click", function(d, i) { window.open("http://www.crunchbase.com/organization/"+nodes[i].permalink,'_blank') })
      .attr("class", "name");
      // .on("mouseover", mouseoverFirm)
      // .on("mouseout", mouseoutFirm)

  function row(row) {
    var cell = d3.select(this).selectAll(".cell")
        .data(row.filter(function(d) { return d.z; }))
      .enter().append("rect")
        .attr("class", "cell")
        .attr("x", function(d) { return x(d.x); })
        .attr("width", x.rangeBand())
        .attr("height", x.rangeBand())
        .style("fill-opacity", function(d) { return z(Math.floor(d.z)); })
        .style("fill", function(d) { return nodes[d.x].group == nodes[d.y].group ? c(nodes[d.x].group) : null; })
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .on("click", cellClicked);
  }
  
  function mouseover(p) {
    d3.selectAll(".row text").classed("active", function(d, i) { return i == p.y; });
    d3.selectAll(".column text").classed("active", function(d, i) { return i == p.x; });
  }

  function mouseout() {
    d3.selectAll("text").classed("active", false);
  }

  function cellClicked(p) {
    d3.selectAll(".cell").classed("active-cell", false);
    if(p != lastClick) {
      d3.selectAll(".cell").classed("active-cell", function(d, i) {return d.y == p.y && d.x == p.x});
      lastClick = p;
      console.log("build graphs");
      byCat(nodes[p.y], nodes[p.x]);
      drawline(nodes[p.y], nodes[p.x]);
      drawDoubleMap(nodes[p.y], nodes[p.x]);
    } else {
      lastClick = null;
      console.log("set averages");
      setcatav();
      lineave();
      mapAve();
    }

    console.log(nodes[p.y].name, nodes[p.x].name);
  }

  d3.select("#order").on("change", function() {
    // clearTimeout(timeout);
    order(this.value);
  });

  function order(value) {
    x.domain(orders[value]);

    var t = svg.transition().duration(1000);

    t.selectAll(".row")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(0," + x(i) + ")"; })
      .selectAll(".cell")
        .delay(function(d) { return x(d.x) * 4; })
        .attr("x", function(d) { return x(d.x); });

    t.selectAll(".column")
        .delay(function(d, i) { return x(i) * 4; })
        .attr("transform", function(d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
  }

  // var timeout = setTimeout(function() {
  //   order("count");
  //   d3.select("#order").property("selectedIndex", 1).node().focus();
  // }, 2500);
});

function makebyCat() {
  catsvg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(" + 0 + "," + dheight + ")")
  .call(catxAxis)
  .selectAll("text")
  .attr("y", 0)
  .attr("x", 9)
  .attr("dy", ".35em")
  .attr("transform", "rotate(90)")
  .style("text-anchor", "start");

  catsvg.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + dwidth + "," + 0 + ")")
  .call(catyAxis);


  setcatav();
}

function setcatav() {
  catsvg.selectAll("rect").remove();
  catav = {};
  allFirms.forEach(function(d){
    d3.keys(d['cat']).map(function(j){
      catav[j] = (catav[j] != null) ? catav[j] + d['cat'][j] : d['cat'][j];
    })
  })
  var tdata = d3.keys(catav).map(function(j) {
    return {'key':j, 'val':catav[j]/allFirms.length}
  });
  catsvg.selectAll("rect")
  .data(tdata)
  .enter().append("rect")
  .attr("x", function(d, i) {
      return catxScale(d.key);
  })
  .attr("y", function(d) {
      return catyScale(d.val);
  })
  .attr("width", catxScale.rangeBand())
  .attr("height", function(d) {
      return dheight - catyScale(d.val);
  })
  .attr("transform", function(d) {
    return "translate(" + 0 + "," + (0) + ")";
  });
}

function byCat(p0, p1){
  catsvg.selectAll("rect").remove();
  var f0 = null;
  var f1 = null;
  allFirms.forEach(function(d){
    if (p0.index == d['index']) {
      f0 = d3.keys(d.cat).map(function(j) {
        return {'key':j, 'val':d['cat'][j]}
      });
    }
    if (p1.index == d['index']) {
      f1 = d3.keys(d.cat).map(function(j) {
        return {'key':j, 'val':d['cat'][j]}
      });
    }
  });
  
  catsvg.selectAll(".f0")
  .data(f0)
  .enter().append("rect")
  .attr("x", function(d) { return catxScale(d.key); })
  .attr("y", function(d) { return catyScale(d.val); })
  .attr("width", catxScale.rangeBand()/2)
  .attr("height", function(d) { return dheight - catyScale(d.val); })
  .attr("transform", function(d) { return "translate(" + 0 + "," + 0 + ")"; })
  .attr("class", "f0");

  catsvg.selectAll(".f1")
  .data(f1)
  .enter().append("rect")
  .attr("x", function(d) { return catxScale(d.key) + (catxScale.rangeBand()/2); })
  .attr("y", function(d) { return catyScale(d.val); })
  .attr("width", (catxScale.rangeBand()/2))
  .attr("height", function(d) { return dheight - catyScale(d.val); })
  .attr("transform", function(d) { return "translate(" + 0 + "," + 0 + ")"; })
  .attr("class", "f1");
}

function lineGraph(p){
  linesvg.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(" + 0 + "," + dheight + ")")
  .call(linexAxis)
  .selectAll("text")
  .attr("y", 0)
  .attr("x", 9)
  .attr("dy", ".35em")
  .attr("transform", "rotate(90)")
  .style("text-anchor", "start");


  linesvg.append("g")
  .attr("class", "y axis")
  .attr("transform", "translate(" + dwidth + "," + 0 + ")")
  .call(lineyAxis);

  lineave();
}

function lineave() {
  linesvg.selectAll(".line-all").remove();
  
  var lineav = {};
  allFirms.forEach(function(d){
    d3.keys(d['time']).map(function(j){
      lineav[j] = (lineav[j] != null) ? lineav[j] + d['time'][j] : d['time'][j];
    })
  })

  var tdata = d3.keys(lineav).map(function(j) {
    return {'year':j, 'val':lineav[j]/allFirms.length}
  });

  // console.log(lineav);

  linesvg.append("path")
  .datum(tdata.filter(function(d){return d.year < 2014}))
  .attr("class", "line line-all")
  .attr("d", line);
}

function drawline(p0, p1){
  linesvg.selectAll(".line-all").remove();
  var f0 = null;
  var f1 = null;
  allFirms.forEach(function(d){
    if (p0.index == d['index']) {
      f0 = d3.keys(d.time).map(function(j) {
        return {'year':j, 'val':d['time'][j]}
      });
    }
    if (p1.index == d['index']) {
      f1 = d3.keys(d.time).map(function(j) {
        return {'year':j, 'val':d['time'][j]}
      });
    }
  });

  linesvg.append("path")
  .datum(f0.filter(function(d){return d.year < 2014}))
  .attr("class", "f0 line-all")
  .attr("d",line)

  linesvg.append("path")
  .datum(f1.filter(function(d){return d.year < 2014}))
  .attr("class", "f1 line-all")
  .attr("d",line)

}

function createMap (){
  d3.json("data/us-named.json", function(data) {



    var usMap = topojson.feature(data,data.objects.states).features

   var states = mapsvg.selectAll(".country").data(usMap).enter()
        .append("path")
        .attr("d",path)
        .attr("class","country")
        .attr("id",function(d){return d.properties.code;})


    mapAve();
        
});


}

function drawDoubleMap(p0,p1){
  
  mapsvg.selectAll("circle").remove();

  var buttonnames = [p0.name,p1.name]
  var p = p0;

  var button = mapsvg.selectAll("circle")
    .data(buttonnames)
    .enter()
    .append("circle")
    .attr("type","button")
    .attr("class","button")
    .attr("r","10")
    .style("stroke", "black")
    .style("stroke-width", 1)
    .style("fill",function(d, i){if(i==0){return "steelblue"}else{return "pink"}})
    .attr("transform", function(d,i){
      var x = 365;
      var y =  30*i + 45;
      return "translate("+x+","+y+")"
    })
    .on("click",function(d,i){
      if(i==0){
        updateMap(p0, 0);
        mapsvg.selectAll("circle")
        .style("fill-opacity",function(d,i){return 1 - (i/2)})
      }else{
        updateMap(p1, 1);
        mapsvg.selectAll("circle")
        .style("fill-opacity",function(d,i){return .5 + (i/2)})
      }
    })

    updateMap(p0, 0);

}

function updateMap(p, f){

  var tdata;

  if (f == 0) {
    heatmap.range(["#fff", "steelblue"]);
  } else {
    heatmap.range(["#fff", "pink"]);
  }
  
  allFirms.forEach(function(d){
    if (p['index'] == d['index']) {
       tdata = d3.keys(d['state']).map(function(j) {
          return {'state':j, 'val':d['state'][j]}
      });
    }
  });


  tdata = tdata.filter(function(d){return d.state != ""});

  tdata.forEach(function(d){
    var selector = "#"+d.state;
    mapsvg.select(selector)
    .style("fill", heatmap(d.val))
  })

}

function mapAve(){

  mapsvg.selectAll("circle").remove();
  heatmap.range(["#fff", "steelblue"]);

  var state_ave = [];
  var tdata;

  allFirms.forEach(function(d){
    d3.keys(d['state']).map(function(e){
      state_ave[e] = (state_ave[e] != null) ? state_ave[e] + d['state'][e] : d['state'][e];
    })
  })

  tdata = d3.keys(state_ave).map(function(d){
    return {'state': d, 'val': state_ave[d]/allFirms.length}
  })

  tdata = tdata.filter(function(d){return d.state != ""});

  tdata.forEach(function(d){
    var selector = "#"+d.state;
    mapsvg.select(selector)
    .style("fill",heatmap(d.val))
  })

}