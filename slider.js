import { fromEvent } from 'rxjs';

export function initSlider(pixelSubject$) {
    const slider = document.getElementById("lifeSlider");
    slider.value = pixelSubject$.value;

    const valueChanged$ = fromEvent(slider, "change");
    valueChanged$.subscribe(evt => {
        const nextValue = parseInt(evt.target.value);
        pixelSubject$.next(nextValue);
    });
}