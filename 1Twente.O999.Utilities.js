// MOMENTJS
let moment = require("moment-timezone");
moment.locale("nl");

const fs = require("fs");
let csv = require("fast-csv");

var ffmpeg = require("fluent-ffmpeg");
const path = require("path");

let tsvData = [];

async function processFiles() {
  try {
    const screenshotsDir = path.join("./1Twente/Music Videos", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir);
    }

    getFiles("./1Twente/Music Videos", async (err, theFiles) => {
      if (err) {
        console.error("Error getting files:", err);
        return;
      }

      console.log(`Found ${theFiles.length} files to process`);

      for (let i = 0; i < theFiles.length; i++) {
        console.log(`Processing file ${i + 1}/${theFiles.length}`);
        try {
          await createScreenshot(theFiles[i], screenshotsDir);
        } catch (err) {
          console.error("Error processing file:", err);
          // Continue with next file even if this one fails
        }
      }

      console.log("All files processed!");
    });
  } catch (err) {
    console.error("Error:", err);
  }
}

async function createScreenshot(videoFile, screenshotsDir) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(videoFile, path.extname(videoFile));

    ffmpeg(`./1Twente/Music Videos/${videoFile}`)
      .screenshots({
        timestamps: ["00:01:00"],
        folder: screenshotsDir,
        filename: `${filename}.png`,
        size: "1920x1080",
      })
      .on("end", () => {
        console.log(`✓ Screenshot created for ${filename}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`✗ Error creating screenshot for ${filename}:`, err);
        reject(err);
      });
  });
}

processFiles();

function compareCSV() {
  var stream = fs.createReadStream("./uploads/1T.O999.2024.txt");
  csv
    .parseStream(stream, { headers: true, delimiter: "\t" })
    .on("data", function (data) {
      tsvData.push(data);
    })
    .on("end", function () {
      // console.log(tsvData);
      compareFiles();
      // renameFiles(tsvData);
    });

  function compareFiles() {
    let updatedTSV = [];
    getFiles("./1Twente/Music Videos", (err, theFiles) => {
      let splittedFiles = [];
      theFiles.forEach((singleFile) => {
        let theFile = {
          itemCode: singleFile.split("_")[0],
          fileName: singleFile,
        };

        splittedFiles.push(theFile);
      });

      tsvData.forEach((singleTSV, index) => {
        let newData = singleTSV;
        newData.videoLinked = false;
        newData.filename = null;

        splittedFiles.forEach((singleSplit) => {
          if (singleTSV.omni_item_code === singleSplit.itemCode) {
            newData.videoLinked = true;
            newData.filename = singleSplit.fileName;
          }
        });

        updatedTSV.push(newData);

        if (index === tsvData.length - 1) {
          csv
            .writeToPath(`./uploads/1T.O999.2024.Linked.tsv`, updatedTSV, {
              headers: true,
              delimiter: "\t",
            })
            .on("finish", function () {
              console.log("DONE");
            });
        }
      });
    });
  }
}

function renameFiles(mediaFiles) {
  mediaFiles.forEach((mediaFile) => {
    fs.rename(
      `./1Twente/Music Videos/${mediaFile.filename}`,
      `./1Twente/Music Videos/${mediaFile.new_filename}`,
      (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log("\nFile Renamed\n");
        }
      }
    );
  });
}

function getFiles(directoryPath, callback) {
  fs.readdir(directoryPath, function (err, files) {
    //handling error
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    callback(undefined, files);
  });
}
