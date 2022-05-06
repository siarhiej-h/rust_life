import { BehaviorSubject } from "rxjs";

export function initGenerations(initValue) {
    const generationsText = document.getElementById("lifeText");
    generationsText.textContent = `Generations passed 0`;

    const generationsChangedSubject$ = new BehaviorSubject(initValue);
    generationsChangedSubject$.subscribe((value) => generationsText.textContent = `Generations passed ${value}`);
    
    return generationsChangedSubject$;
}