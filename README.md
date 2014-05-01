#VC Showdown#
Johnathn Budd | Jared Rosen

*	Our project website is: //TODO
*	Our screencast can be found at: [http://youtu.be/NpDiIC5VKlk](http://youtu.be/NpDiIC5VKlk)

##Repository Overview##
Our repository contains our processbook, design studio, and this README along with two subdirectories: `data` and `website`.  The `data` directory contains the iPython Notebook where we did all the data gathering/preliminary analysis and various json files that were merged to create our final data set `allFirms_2014-04-07-01-06-44_out.json`. The `website` directory is where we actually built our visualization. `js/viz.js` and `css/viz.css` are the two key files as they contain the overwhelming majority for our code. ‘js/jquery.easyModal.js’ is a simple modal plugin downloded from the [Interent](http://flaviusmatis.github.io/easyModal.js/).

##Feature Overview##
*	In the co-occurrence matrix the opacity encodes the number of co-investments while the color encodes if the firm is focused on primarily on early (orange), mid (green), or late (red) stage investments.
*	Clicking a firms name on either axis of the co-occurrence matrix will open its [CrunchBase](http://www.crunchbase.com) profile.
*	The co-occurrence matrix can be sorted by frequency of co-investments (default), cluster (early, mid, late), or alphabetically.  
*	When the page loads the three sub-visualizations display average/summary statistics, clicking a cell in the co-occurrence matrix updates them. Clicking the same cell again will bring back the averages.
*	The two circular buttons next to the heatmap sub-visualization toggle the view to show information for each of the two firms
*	If a cell on the diagonal (where a firm intersects with itself) is clicked the sub-visualizations only show information for that one firm.