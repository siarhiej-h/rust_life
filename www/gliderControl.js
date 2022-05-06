import { BehaviorSubject, fromEvent } from 'rxjs';

export function initGliderControls() {
    const initValue = "UpLeft";
    const gliderRadioBoxes = document.getElementsByClassName("gliderDirectionRadio");    

    for (let box of gliderRadioBoxes) {
        box.setAttribute("checked", box.value === initValue);
        box.checked = box.value === initValue;
    }

    const gliderDirectionSub$ = new BehaviorSubject(initValue);
    for (let radioBox of gliderRadioBoxes) {        
        const clickSub$ = fromEvent(radioBox, "click");
        clickSub$.subscribe(_ => gliderDirectionSub$.next(radioBox.value));
    }
    return gliderDirectionSub$;
}

export function initGliderModeButton() {
    const checkBox = document.getElementById("gliderModeCheckbox");
    checkBox.removeAttribute("checked");
    checkBox.checked = false;

    const clickSub$ = fromEvent(checkBox, "click");
    const sub$ = new BehaviorSubject(true);
    clickSub$.subscribe(() => sub$.next(!sub$.value));
    return sub$;
}
