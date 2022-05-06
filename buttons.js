import { fromEvent } from 'rxjs';
import { hide, unhide } from './utils';

export function initButtons(resetUniverse, startLoop, stopLoop) {
    const startButton = document.getElementById("lifeStartButton");
    const stopButton = document.getElementById("lifeStopButton");
    const resumeButton = document.getElementById("lifeResumeButton");
    const resetButton = document.getElementById("lifeResetButton");    
    const pixelSlider = document.getElementById("lifeSlider");
    const startModeDropDown = document.getElementById("lifeStartDropDown");
    const generationText = document.getElementById("lifeText");

    const start$ = fromEvent(startButton, "click");
    start$.subscribe(() => startLoop());
    start$.subscribe(() => hide(startButton));
    start$.subscribe(() => hide(pixelSlider));
    start$.subscribe(() => hide(startModeDropDown));    
    start$.subscribe(() => unhide(stopButton));
    start$.subscribe(() => unhide(generationText));    

    const stop$ = fromEvent(stopButton, "click");
    stop$.subscribe(() => stopLoop());
    stop$.subscribe(() => hide(stopButton));
    stop$.subscribe(() => unhide(resumeButton));
    stop$.subscribe(() => unhide(resetButton));
    
    const resume$ = fromEvent(resumeButton, "click");
    resume$.subscribe(() => startLoop());
    resume$.subscribe(() => hide(resumeButton));
    resume$.subscribe(() => hide(resetButton));
    resume$.subscribe(() => unhide(stopButton));
    
    const reset$ = fromEvent(resetButton, "click");
    reset$.subscribe(() => resetUniverse());
    reset$.subscribe(() => hide(resetButton));
    reset$.subscribe(() => hide(resumeButton));
    reset$.subscribe(() => hide(generationText));
    reset$.subscribe(() => unhide(startButton));
    reset$.subscribe(() => unhide(startModeDropDown));
    reset$.subscribe(() => unhide(pixelSlider));
}
