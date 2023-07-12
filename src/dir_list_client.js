//global vars to be used by client
var dirHistory = [];    //history of directories client has visited
var tableRowsStrings = [];
var tableRowsJSON = {};
var headers = ["filename", "type", "size", "atime", "mtime", "ctime", "birthtime"];
var sorts = [];
var onDesc = false;

//on page load, call these three functions
makeRequest("/");
getDirName();
getHostName();

/**
 * fetches current directory being viewed and changes the page html to display it
 */
function getDirName(){
    fetch("api/getDirName").
    then(res => res.text()).
    then(res => document.getElementById("dirName").innerHTML = res).
    then(res => document.getElementById("dirNameGreen").innerHTML = res).
    then(res => dirHistory[0] = res)
}

/**
 * fetches the hostname of the server that the client is connected to and displays it on the page
 */
function getHostName(){
    fetch("api/getHostName").
    then(res => res.json()).
    then(res => document.getElementById("hostname").innerHTML = res["hostname"])
}

/**
 * sends a post request of JSON data requesting the dirinfo of a given directory
 * then recieves a response from the server and constructs html of the table to be displayed on the page
 * @param {string} dir name of directory to view (not path)
 */
function makeRequest(dir){

    if(dir != "/"){

        //if the request is for a new dir
        if(dirHistory[dirHistory.length -1] != dir){
            
            //concatenate previous directory with new dir to create a path
            dir = dirHistory[dirHistory.length - 1] + dir;
        
            //add new dir path to the history
            dirHistory[dirHistory.length] = dir;
        }
       
        //update directory name elements
        document.getElementById("dirName").innerHTML = dir;
        document.getElementById("dirNameGreen").innerHTML = dir;
    }

    //send request for dirinfo off to server
    const body = {
        request: "dirinfo",
        dirpath: dir
    };

    const request = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    }

    fetch("api", request).


        //server response
        then(res => res.json()).
        then(res => {
            
            
            //table div opening tag
            let tableStrVar ="<div id =\"dirTable\">";

            //reset all the sorts back to ascending
            for(let i = 0; i < 7; i++){
                sorts[i] = "sortAsc";
            }

            //generate the headers
            tableStrVar += generateTableHeader();

            //get all files in requested directory
            let allFiles = res.info.files;

            //update JSON data for files
            tableRowsJSON = allFiles;

            //reset string data
            tableRowsStrings = [];  

            //for every file
	        for(let file in allFiles){

                //if of type directory, then update boolean variable for later
                let directory = false;
                if(allFiles[file]["type"] === "directory")
                    directory = true;
                
                let strVar = "";
		        strVar += "<file>";
                
                //for every key in the file
		        for(var key in allFiles[file]){

                    let value = allFiles[file][key];
                    
                    //if the current file is a directory, wrap the element with a button and directory tags so it can be styled
                    if(key === "filename" && directory === true){
                        value = "<directory><label id=\"dirButton\" onclick=\"newDir('"+value+"')\" >" + value + "<\/label><\/directory>";
                    }
                    
                    //add element
			        strVar += "<"+key+">" + value + "<\/"+key+">";
		        }

                strVar += "<\/file>";
            
                //add the row to strings data
                tableRowsStrings[tableRowsStrings.length] = strVar;
                
                tableStrVar += strVar;
            }

            //end table div
            tableStrVar += "<\/div>";


            //display table on the page
	        document.getElementById("dirTable").outerHTML = tableStrVar;
    
        });

}

/**
 * called when clicking on sub folder, makes a new request with the clicked directory
 * @param {string} dir sub folder to navigate to
 */
function newDir(dir){
    makeRequest("/" + dir);
}

/**
 * called when clicking the up button,
 * makes a request for the previous directory in the history
 */
function prevDir(){
    
    //if already at start of the root
    let len = dirHistory.length;
    if(len === 1){
        dirHistory = [];
        makeRequest("/");
        getDirName();

        //if not
    } else{

        //remove last element in history
        dirHistory.pop();

        //make request of previous directory
        makeRequest(dirHistory[dirHistory.length - 1]);
    }
}

/**
 * generates a html string for the header of the table
 * @return {string} html header string
 */
function generateTableHeader(){
    let strVar = "";
    strVar += "<file>";

        //applies correct tag names and heading and also sort function to onclick
        for(let i = 0; i < headers.length; i++){
            strVar += "<"+headers[i]+" class=\"heading\" onclick='"+sorts[i]+"(\""+headers[i]+"\")'>"+headers[i]+"<\/"+headers[i]+">";
        }
    strVar += "<\/file>";

    return strVar;
}

/**
 * called when one of the check boxes is changed
 * 
 * @param {boolean} checked box was checked or not
 * @param {string} name name of column to hide / show
 */
function handleCheck(checked, name) {

    //get the column that matches the name of the box that is checked
    var column = document.getElementsByTagName(name);   
    
    //if the box was checked then display that column
    if(checked){
        for(let i = 0; i < column.length; i++){
            column[i].style.display = "";
        }
    } else{
    //if the box was unchecked then hide that column
        for(let i = 0; i < column.length; i++){
            column[i].style.display = "none";
        }
    }
}


/**
 * sorts the table in ascending order for a specified heading
 * 
 * @param {string} heading column heading to sort
 */
function sortAsc(heading){

    //reset sorts
    for(let i = 0; i < sorts.length; i++){
        sorts[i] = "sortAsc" ;
    }

    //if currently in descending order
    if(onDesc){
        onDesc = false;

        //reset table to default sort
        makeRequest(dirHistory[dirHistory.length-1]);

    //if already on default sort
    } else{
        onDesc = true;

        //update sort function for that column
        let index = headers.indexOf(heading);
        sorts[index] = "sortDesc";

        //get the values of every row for that heading
        let values = getValues(heading);

        //sort these values
        bubbleSort(values);
       
        //update the table
        refreshTable();
    }
}

/**
 * sorts the table in descending order for a specified heading
 * 
 * @param {string} heading column heading to sort
 */
function sortDesc(){
        
    //reset sorts
    for(let i = 0; i < sorts.length; i++){
        sorts[i] = "sortAsc" ;
    }

    //reverse the table as the table is already in ascending order
    tableRowsStrings.reverse();

    refreshTable();
}

/**
 * gets the value of the specified heading for every row
 * 
 * @param {string} heading 
 * @return {string[]} array of strings of values
 */
function getValues(heading){
    let values = [];
    let c = 0;
    for(let file in tableRowsJSON){
        values[c] = tableRowsJSON[file][heading];
        c++;
    }
    return values;
}


/**
 * updates the order of the rows in the table on the page
 */
function refreshTable(){
    //div start and headers
    let strTableVar = "";
    strTableVar = "<div id =\"dirTable\">";
    strTableVar += generateTableHeader();

    //new row strings
    for(let i = 0; i < tableRowsStrings.length; i++){
        strTableVar += tableRowsStrings[i];
    }

    //end div
    strTableVar += "<\/div>";

    //update the table
    document.getElementById("dirTable").outerHTML = strTableVar;

}

/**
 * simple bubblesort
 * adapted from https://stackoverflow.com/questions/7502489/bubble-sort-algorithm-javascript
 * 
 * @param {string[]} values array of values to be sorted 
 */
function bubbleSort(values){

    var swapped;
    do {
        swapped = false;
        for (var i=0; i < values.length-1; i++) {
            if (values[i] > values[i+1]) {

                //swap the values and the row strings at the same elements
                swap(i, values);
                swap(i, tableRowsStrings);
                swapped = true;
            }
        }
    } while (swapped);

}

/**
 * swaps 2 elements in an array
 * 
 * @param {int} i index to be swapped with the one after it
 * @param {*[]} array array in which swap takes place
 */
function swap(i, array){
    //use a temp variable to swap elements
    var temp = array[i];
    array[i] = array[i+1];
    array[i+1] = temp;
}

