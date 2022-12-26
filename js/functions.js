"use strict"

const canvas = document.querySelector("canvas")
const ctx = canvas.getContext("2d", {willReadFrequently: true})
var canvasData_o
var width, height
var loaded = 0

var img = new Image()

var initialValuesSet = false

var nodes = []
var lastNodeID = -1

const NODESTR =
`
<div class="node">
    <div class="node-inputs">
        <div class="even flex">
            <input type="color" id="in[[ID]]A" value="#00ff00" oninput="change([[ID]], 'a', this.value)"/>
            <span class="rarr"></span>
            <input type="color" id="in[[ID]]B" value="#000000" oninput="change([[ID]], 'b', this.value)"/>
        </div>
        <div class="center flex">
            <input type="range" min="1" max="254" id="in[[ID]]R" value="5" oninput="change([[ID]], 'r', this.value)" />
        </div>
    </div>
    <div class="exit" onclick="removeNode([[ID]], this.parentElement)"></div>
</div>
`

function g(str) { return document.getElementById(str) }

class Node
{
    constructor()
    {
        lastNodeID++
        const node = document.createElement("div")
        node.innerHTML = NODESTR.replaceAll("[[ID]]", lastNodeID)
        g("nodes").appendChild(node)
        nodes.push({
            id: lastNodeID,
            a: [0, 255, 0],
            b: [0, 0, 0],
            r: 5
        })
    }
}

function change(id, type, to)
{
    nodes.forEach(node => {
        if (node.id == id)
        {
            if (type == "a" || type == "b")
            {
                // convert hex to [r, g, b]
                // (credit to chatGPT)
                node[type] = [parseInt(to.substring(1, 3), 16), parseInt(to.substring(3, 5), 16), parseInt(to.substring(5, 7), 16)];
            }
            else node[type] = to
        }
    })
}

function parse(event)
{
    const file = event.dataTransfer.files[0]
    console.log(file.type.startsWith("image/"))
    event.preventDefault()
    if (
        event.dataTransfer.files.length != 0 &&
        file.type.startsWith("image/")
    )
    {
        console.time("all_loaded")
        g("col-right").removeEventListener("drop", parse)

        const r = new FileReader()
        const rSIZE = new FileReader()

        r.addEventListener("load", () => {
            console.log("r load event")
            loaded++
        })

        rSIZE.addEventListener("load", () => {
            console.log("rSIZE load event")
            img.addEventListener("load", () => {
                console.log("img load event")
                
                width = img.naturalWidth
                height = img.naturalHeight

                if (width * height > 640000 && !confirm("Files over 640000 pixels in size may be unstable or laggy. Try anyway?")) window.location.reload()
                else
                {
                    canvas.width = width
                    canvas.height = height
    
                    g("dnd-message").remove()
                    canvas.style.display = "block"
                    g("new-node").removeAttribute("disabled")
    
                    loaded++
                }
            })
    
            img.src = rSIZE.result

            loaded++
        })

        r.readAsArrayBuffer(file)
        rSIZE.readAsDataURL(file)

        console.log(event.dataTransfer.files[0])
    }
}

function removeNode(id, element)
{
    nodes.forEach(node => {
        if (node.id == id)
        {
            element.remove()
            nodes.splice(nodes.indexOf(node), 1)
        }
    })
}

function main()
{
    if (loaded == 3)
    {
        if (!initialValuesSet)
        {
            initialValuesSet = true

            console.timeEnd("all_loaded")

            g("width").innerText = width
            g("height").innerText = height

            ctx.drawImage(img, 0, 0)
            canvasData_o = ctx.getImageData(0, 0, canvas.width, canvas.height)
        }
        else
        {
            // https://stackoverflow.com/a/17717174
            const canvasDataModified_o = ctx.createImageData(width, height*4)
            const dataToCopy = JSON.parse(JSON.stringify(canvasData_o)).data
            for (var i = 0; i < width * height * 4; i++) canvasDataModified_o.data[i] = dataToCopy[i.toString()]
            const canvasData = canvasData_o.data
            const canvasDataModified = canvasDataModified_o.data

            for (let i = 0; i < canvasData.length; i += 4) {
                const red = canvasData[i];
                const green = canvasData[i + 1];
                const blue = canvasData[i + 2];

                nodes.forEach(node => {
                    // https://stackoverflow.com/a/10368021
                    if (Math.abs(red,   node.a[0]) <= node.r) canvasDataModified[i + 0] = node.b[0]
                    if (Math.abs(green, node.a[1]) <= node.r) canvasDataModified[i + 1] = node.b[1]
                    if (Math.abs(blue,  node.a[2]) <= node.r) canvasDataModified[i + 2] = node.b[2]
                })
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height)    
            ctx.putImageData(canvasDataModified_o, 0, 0)
        }
    }

    requestAnimationFrame(main)
}
