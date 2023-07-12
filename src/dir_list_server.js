const express = require("express");
const app = express();
app.use(express.json());
const os = require("os");
const fs = require('fs');
const path = require("path");
const { dirname } = require("path");

//get custom user id for the port
const port = process.getuid();

//name of files
const page_css_file = "page.css";
const page_html_file = "page.html";
const script_file = "dir_list_client.js";

//remove "src" from __dirname
const dir_parent_path = __dirname.slice(0, (__dirname.length - 3));


//process command line argument
const root = process.argv.slice(2, 3)[0];
console.log("root path: " + root);


//if user hasn't provided a root path
if(root == undefined){
		console.log("Please provide root directory");
		throw new Error("expected command line argument");
}

//open server
app.listen(port, () => console.log("Listening at port: " + port));



///////////////////////////////// get handlers ///////////////////////////////// 

//load page
app.get("/", (req, res) => {
	console.log("Received request for page load");
	res.sendFile(__dirname + "/" + page_html_file);
})

//load script file
app.get("/dir_list_client.js", (req, res) => {
	console.log("Received request for script file");
	res.sendFile(__dirname + "/" + script_file);
})

//load page CSS
app.get("/page.css", (req, res) => {
	console.log("Recieved request for CSS file");
	res.sendFile(__dirname + "/" + page_css_file);
})

//send hostname to client
app.get("/api/getHostname", (req, res) => {
	res.send(JSON.stringify({ 'hostname': os.hostname() }))
})

//send inital directory name to client as client may not know it
app.get("/api/getDirName", (req, res) => {
	res.send(root);
})

///////////////////////////////// get handlers ///////////////////////////////// 
 


/**
 * handles post request for dir info as received from client
 * 
 * collects all file data from that directory into JSON to be sent back to client
 */
app.post("/api", (req, res) => {
	console.log("Recieved post request from client");

	var dir = req.body.dirpath;

	//default request
	if(dir === "/")
	dir += root;

	//setup JSON response
	const response = {
		response: "dirinfo",
		info: {
			server: "TODO",
			directoryname: dir,
			files: {}
		}

	}

	//get path to requested directory
	let dirPath = dir_parent_path + dir;

	//for every file in the directory
	fs.readdirSync(dirPath).forEach(file => {
		
		//add file details to response object
		let fileInfo = getFileInfo(dirPath, file);
		response["info"]["files"][file] = fileInfo;
	});


	//send response object
	res.send(response);

})

 

/**
 * method provided from studres and very slightly modified
 * 
 * returns the file information for a file 
 * 
 * @param {string} directoryname directory path of file
 * @param {string} filename name of file
 * @return {string[]} data for file
 */
function getFileInfo(directoryname, filename) {
    const fileInfo_keys = ["size", "atime", "mtime", "ctime", "birthtime"]
    let filePath = path.join(directoryname, filename);
    let fs_stats = fs.statSync(filePath);

    let fileInfo = {}

	fileInfo["filename"] = filename;

    let type = "unknown";
    if      (fs_stats.isFile())            { type = "file" }
    else if (fs_stats.isDirectory())       { type = "directory" }
    else if (fs_stats.isBlockDevice())     { type = "block" }
    else if (fs_stats.isCharacterDevice()) { type = "character" }
    else if (fs_stats.isFIFO())            { type = "fifo" }
    else if (fs_stats.isSocket())          { type = "socket" }
    fileInfo["type"] = type


    fileInfo_keys.forEach(k => {
        fileInfo[k] = fs_stats[k]
        if (k.includes("time")) {
            fileInfo[k] = fileInfo[k].toLocaleString("en-GB")
        }
	})
	
    return fileInfo
}



