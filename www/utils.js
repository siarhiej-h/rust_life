export function hide(element) {
    element.setAttribute("hidden", "");
}

export function unhide(element) {
    element.removeAttribute("hidden");
}

export function start() {
    return new Date();
};

export function end(startTime, measure) {
  var timeDiff = new Date() - startTime;
  console.log(`${timeDiff} ms per ${measure}`);
}