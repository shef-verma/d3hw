// Load the data
const socialMedia = d3.csv("data/socialMedia.csv");

// Once the data is loaded, proceed with plotting
socialMedia.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
        d.Likes = +d.Likes;
    });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    

    // Set up scales for x and y axes
    // You can use the range 0 to 1000 for the number of Likes, or if you want, you can use
    // d3.min(data, d => d.Likes) to achieve the min value and 
    // d3.max(data, d => d.Likes) to achieve the max value
    // For the domain of the xscale, you can list all four platforms or use
    // [...new Set(data.map(d => d.Platform))] to achieve a unique list of the platform
    

    // Add scales
    const x = d3.scaleBand()
    .domain([...new Set(data.map(d => d.Platform))]) // Unique platforms
    .range([0, width])
    .padding(0.1);
    
    const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.Likes)]) // Max Likes value
    .nice() // Makes the scale have a nice round domain
    .range([height, 0]);

    svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

    svg.append("g")
    .call(d3.axisLeft(y));


    // Add x-axis label
    svg.append("text")
    .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom) + ")")
    .style("text-anchor", "middle")
    .text("Platform");
    

    // Add y-axis label
    svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .style("text-anchor", "middle")
    .text("Likes");
  

    const rollupFunction = function(groupData) {
        const values = groupData.map(d => d.Likes).sort(d3.ascending);
        const min = d3.min(values); 
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const max = d3.max(values);
        return {min, q1, median, q3, max};
    };

    // Group data by group and use the rollupFunction to calculate the quartiles (min, q1, median, q3, max) for each group
    const quantilesByGroups = d3.rollup(data, rollupFunction, d => d.Platform);

    // go over each group and its calculated quartiles, set x position of the boxplot for each species based on the xScale, 
// and calculate width of each box using bandwidth of the xScale
    quantilesByGroups.forEach((quantiles, Platform) => {
        const x = xScale(Platform);
        const boxWidth = xScale.bandwidth();
        const IQR = quartiles.q3 - quartiles.q1;


        // Draw vertical lines
        svg.append("line")
        .attr("x1", x + boxWidth / 2)
        .attr("x2", x + boxWidth / 2)
        .attr("y1", yScale(quantiles.min))
        .attr("y2", yScale(quantiles.max))
        .attr("stroke", "black")
        .attr("stroke-width", 1);

        // Draw box
        svg.append("rect")
        .attr("x", x)
        .attr("y", yScale(quantiles.q3))
        .attr("width", boxWidth)
        .attr("height", yScale(quantiles.q1) - yScale(quantiles.q3))
        .attr("fill", "lightgray");

        // Draw median line
        svg.append("line")
        .attr("x1", x)
        .attr("x2", x + boxWidth)
        .attr("y1", yScale(quantiles.median))
        .attr("y2", yScale(quantiles.median))
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    });
});

// Prepare you data and load the data again. 


// This data should contains three columns, platform, post type and average number of likes. 
const socialMediaAvg = d3.csv("data/SocialMediaAvg.csv");

socialMediaAvg.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes;
    });


    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create the SVG container
    const svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Define four scales
    // Scale x0 is for the platform, which divide the whole scale into 4 parts
    // Scale x1 is for the post type, which divide each bandwidth of the previous x0 scale into three part for each post type
    // Recommend to add more spaces for the y scale for the legend
    // Also need a color scale for the post type

    const x0 = d3.scaleBand()
        .domain(data.map(d => d.Platform))
        .rangeRound([0, width])
        .padding(0.1);
      

    const x1 = d3.scaleBand()
      .domain(['Image', 'Link', 'Video']) // Three post types
      .rangeRound([0, x0.bandwidth()])
      .padding(0.05);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .nice()
      .range([height, 0]);

    const color = d3.scaleOrdinal()
      .domain([...new Set(data.map(d => d.PostType))])
      .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);    
         
    // Add scales x0 and y     
    svg.append("g")
        .selectAll("g")
        .data(d3.groups(data, d => d.Platform))
        .enter().append("g")
        .attr("transform", d => "translate(" + x0(d[0]) + ",0)")
        .selectAll("rect")
        .data(d => d[1])
        .enter().append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));

    // Add x-axis label
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x0));

    // Add y-axis label
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .text("Platform");

    svg.append("text")
        .attr("x", -margin.left + 10)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .text("Average Likes");


  // Group container for bars
    const barGroups = svg.selectAll("bar")
      .data(data)
      .enter()
      .append("g")
      .attr("transform", d => `translate(${x0(d.Platform)},0)`);

  // Draw bars
    barGroups.append("rect")
        .attr("x", d => x1(d.PostType))
        .attr("y", d => y(d.AvgLikes))
        .attr("width", x1.bandwidth())
        .attr("height", d => height - y(d.AvgLikes))
        .attr("fill", d => color(d.PostType));
      

    // Add the legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - 150}, ${margin.top})`);

    const types = [...new Set(data.map(d => d.PostType))];
 
    types.forEach((type, i) => {

    // Alread have the text information for the legend. 
    // Now add a small square/rect bar next to the text with different color.
      legend.append("text")
          .attr("x", 20)
          .attr("y", i * 20 + 12)
          .text(type)
          .attr("alignment-baseline", "middle");
  });

});

// Prepare you data and load the data again. 


// This data should contains two columns, date (3/1-3/7) and average number of likes. 

const socialMediaTime = d3.csv("data/SocialMediaTime.csv");

socialMediaTime.then(function(data) {
    // Convert string values to numbers
    data.forEach(function(d) {
      d.AvgLikes = +d.AvgLikes;  // Convert AvgLikes to a number
  });

    // Define the dimensions and margins for the SVG
    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;


    // Create the SVG container
    const svg = d3.select("body").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales for x and y axes  
    const x = d3.scaleBand()
        .domain(data.map(d => d.Date))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.AvgLikes)])
      .nice()
      .range([height, 0]);

    // Draw the axis, you can rotate the text in the x-axis here
    svg.append("g")
        .selectAll(".x-axis")
        .data(data)
        .enter()
      .append("text")
        .attr("x", (d, i) => x(d.Date) + x.bandwidth() / 2)
        .attr("y", height + 30)
        .attr("text-anchor", "middle")
        .text(d => d.Date)
        .attr("transform", "rotate(-45)")  // Rotate the text for readability
        .style("font-size", "12px");

    svg.append("g")
        .selectAll(".y-axis")
        .data([0])
        .enter()
      .append("g")
        .call(d3.axisLeft(y))
        .attr("class", "y-axis")
        .attr("transform", "translate(0, 0)");

    // Add x-axis label
    svg.append("text")
        .attr("transform", "translate(" + (width / 2) + "," + (height + margin.bottom - 10) + ")")
        .style("text-anchor", "middle")
        .text("Date");


    

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left + 10)
        .attr("x", 0 - (height / 2))
        .style("text-anchor", "middle")
        .text("Average Number of Likes");


    // Draw the line and path. Remember to use curveNatural. 
    const line = d3.line()
        .x(d => x(d.Date) + x.bandwidth() / 2)  // X position (middle of the band for each date)
        .y(d => y(d.AvgLikes))  // Y position (scaled by the average likes)
        .curve(d3.curveNatural);  // Smooth line curve

    svg.append("path")
        .data([data])
        .attr("class", "line")
        .attr("d", line)
        .style("fill", "none")
        .style("stroke", "steelblue")
        .style("stroke-width", 2);



});
