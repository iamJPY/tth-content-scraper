const fs = require('fs');
const converter = require('json-2-csv');
const scrapeIt = require('scrape-it');

/** Check if the 'data' folder exists in project directory */
!fs.existsSync('data') ? fs.mkdirSync('data') : false;

/** Index for days and months for error logging purposes */
const days = ['Sun','Mon','Tues','Wed','Thur','Fri','Sat'];
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let url = 'http://www.shirts4mike.com';
let data = [];
let date = new Date();
var split = new Date().toString().split(" ");
var timeZoneFormatted = split[split.length - 2] + " " + split[split.length - 1];

let convertData = data => {
    /** Convert data to CSV */
    converter.json2csv(data, function(err, csv) {
      if (err) { console.log('Data cannot be converted'); }

      /** Save data to file */
      fs.writeFile(`./data/${date.getFullYear()}-${date.getMonth()}-${date.getDate()}.csv`, csv, (err) => {
        if(err) { console.log('Error in saving file'); }
        console.log('File has been saved');
      });
    });
}

/** Retrieve URLs for each shirt item from entry point */
scrapeIt(`${url}/shirts.php`, {
    products: {
        listItem: ".products li",
        data: {
            links: {
                selector: "a",
                attr: "href"
            }
        }
    }
}).then(page => {
    /** Iterate through URLs and extract pertinent details for each shirt item (Price, Title, imageUrl, url) */
    for(var i = 0; i < page.products.length; i++) {
        var uri = page.products[i].links;
        scrapeIt(`${url}/${uri}`, {
            Price: {
                selector: ".price",
                how: "html"
            },
            Title: {
                selector: ".shirt-picture img",
                attr: "alt"
            },
            ImageURL: {
                selector: ".shirt-picture img",
                attr: "src"
            }
        }).then(page => {
            page.URL = `${url}/${uri}`;
            page.Time = new Date().toLocaleTimeString();
            data.push(page);
            convertData(data);
        }).catch(function(err) {
          console.log(`There’s been a 404 error. Cannot connect to http://shirts4mike.com/${uri}`);

          if (err) {
            fs.appendFileSync('./scraper-error.log', `[${days[date.getDay()]} ${months[date.getMonth()]} ${date.getFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} ${timeZoneFormatted}] ${err}\r`);
          }
        });
    }

/** Error handler */
}).catch(function(err) {
  console.log('There’s been a 404 error. Cannot connect to the to http://shirts4mike.com.');

  if (err) {
    fs.appendFileSync('./scraper-error.log', `[${days[date.getDay()]} ${months[date.getMonth()]} ${date.getFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()} ${timeZoneFormatted}] ${err}\r`);
  }
});
