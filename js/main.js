new Split(document.getElementsByClassName("col"), {minSize: 300})

g("col-right").addEventListener("dragover", event => {
    event.preventDefault()
    event.dataTransfer.effectAllowed = "all"
    event.dataTransfer.dropEffect = "copy"
})

g("col-right").addEventListener("drop", parse)

g("new-node").addEventListener("click", () => new Node())

requestAnimationFrame(main)
