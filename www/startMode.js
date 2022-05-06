import { StartMode } from "wasm-game-of-life";
import { BehaviorSubject, fromEvent } from "rxjs";

export function initStartModeDropdown() {
    const startModeSub$ = new BehaviorSubject(StartMode.Random);
    const dropdown = document.getElementById("lifeStartDropDown");    
    switch (startModeSub$.value) {
        case StartMode.Blank:
            dropdown.value = "Blank";
            break;
        case StartMode.Random:
            dropdown.value = "Random";
            break;
    };
    
    const startModeDropdownChanged$ = fromEvent(dropdown, "change");
    startModeDropdownChanged$.subscribe(evt => {
        const value = evt.target.value;
        const current = startModeSub$.value;
        let next = null;
        switch (value) {
            case "Blank":
                next = StartMode.Blank;                
                break;
            case "Random":
                next = StartMode.Random;
                break;
        };
        if (current !== next) {
            startModeSub$.next(next);
        }
    });

    return startModeSub$;
};