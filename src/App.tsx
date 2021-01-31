import logo from "./logo.svg";
import doritos from "./buffalo-ranch-doritos.png";
import "./App.css";

import {
  animate,
  motion,
  MotionValue,
  useMotionValue,
  useTransform,
} from "framer-motion";

import { useRef, useState } from "react";

const ITEM_WIDTH = 112;
const ITEM_HEIGHT = 145;
const NUM_ITEMS = 12;
const ITEMS_EACH_SIDE = 3;

const CAROUSEL_WIDTH = 350;

function App() {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  const initialDragOffset = useRef(0);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload!
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <motion.div
          drag
          _dragX={dragX}
          // just ignore the drag y lol
          _dragY={dragY}
          dragConstraints={{ left: -(ITEM_WIDTH * (NUM_ITEMS - 1)), right: 0 }}
          style={{
            overflow: "hidden",
            width: CAROUSEL_WIDTH,
            height: ITEM_HEIGHT,
            position: "relative",
            touchAction: "pan-y",
            // @ts-ignore
            "-webkit-touch-callout": "none",
            "-webkit-user-select": "none",
            "-mox-user-select": "none",
            "-o-user-select": "none",
            "user-select": "none",
          }}
          // dragPropagation
          onDragStart={(e, info) => {
            initialDragOffset.current = dragX.get() - info.offset.x;
          }}
          onDragEnd={(e, info) => {
            // snap to an item
            const totalOffset = info.offset.x + initialDragOffset.current;
            let endingIndex = Math.round(-totalOffset / ITEM_WIDTH);

            // respect forceful swipes
            if (info.velocity.x < -50) {
              endingIndex++;
            } else if (info.velocity.x > 50) {
              endingIndex--;
            }

            if (endingIndex < 0) {
              endingIndex = 0;
            } else if (endingIndex >= NUM_ITEMS) {
              endingIndex = NUM_ITEMS - 1;
            }

            animate(dragX, endingIndex * -ITEM_WIDTH);
          }}
        >
          {Array(NUM_ITEMS)
            .fill(null)
            .map((_, i) => (
              <CarouselItem key={i} dragX={dragX} index={i} />
            ))}
        </motion.div>
      </header>
    </div>
  );
}

function CarouselItem(props: { dragX: MotionValue<number>; index: number }) {
  const { dragX, index } = props;
  const minusDragX = useTransform(dragX, (x) => -x);
  const absoluteProgress = useTransform(
    minusDragX,
    [
      (index - ITEMS_EACH_SIDE) * ITEM_WIDTH,
      index * ITEM_WIDTH,
      (index + ITEMS_EACH_SIDE) * ITEM_WIDTH,
    ],
    [-1, 0, 1]
  );
  const opacity = useTransform(absoluteProgress, (p) => 1 - Math.abs(p));

  const scale = useTransform(opacity, (o) => {
    const distanceFromCenter = 1 - o;

    // unit circle, pythagorean theorem (thanks, math class)
    const distanceFromFront = 1 - Math.sqrt(1 - distanceFromCenter ** 2);
    const decreasedScaleAtBack = 0.7;
    return 1 - distanceFromFront * decreasedScaleAtBack;
  });

  const translateX = useTransform(absoluteProgress, (progress) => {
    const radians = ((progress + 1) / 2) * Math.PI;
    const proportionTranslate = Math.cos(radians);
    const maxTranslateAmount = (CAROUSEL_WIDTH - ITEM_WIDTH) / 2;
    return proportionTranslate * maxTranslateAmount;
  });

  const zIndex = useTransform(opacity, (o) => Math.round(o * 20));

  return (
    <motion.img
      src={doritos}
      height={ITEM_WIDTH}
      width={ITEM_WIDTH}
      style={{
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        opacity,
        pointerEvents: "none",
        scale,
        translateX,
        zIndex,
        position: "absolute",
        left: (CAROUSEL_WIDTH - ITEM_WIDTH) / 2,
      }}
    />
  );
}

export default App;
