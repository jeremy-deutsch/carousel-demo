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

import { memo, useCallback, useEffect, useRef, useState } from "react";

const ITEM_WIDTH = 112;
const ITEM_HEIGHT = 145;
const NUM_ITEMS = 12;
const ITEMS_EACH_SIDE = 3;

const CAROUSEL_WIDTH = 350;

function App() {
  // in a real app, you'd lift up useCarouselControls into a parent component
  const { dragX, activeItemIndex, switchToItem } = useCarouselControls();

  const carouselRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      carouselRef.current &&
      carouselRef.current.contains(document.activeElement)
    ) {
      const carouselItems = carouselRef.current.querySelectorAll<HTMLElement>(
        ".carousel-slide"
      );
      const focusableChild = carouselItems[activeItemIndex].querySelector(
        "a:not([tabindex='1']), button:not([tabindex='1']), [tabindex='0']"
      ) as HTMLElement | undefined;
      focusableChild?.focus();
    }
  }, [activeItemIndex]);

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
          className="carousel-container"
          drag="x"
          _dragX={dragX}
          dragConstraints={{ left: -(ITEM_WIDTH * (NUM_ITEMS - 1)), right: 0 }}
          ref={carouselRef}
          style={{
            overflow: "hidden",
            width: CAROUSEL_WIDTH,
            height: ITEM_HEIGHT,
            position: "relative",
            touchAction: "pan-y",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            userSelect: "none",
            // @ts-ignore
            "-o-user-select": "none",
          }}
          onDragStart={(e, info) => {
            document.body.style.setProperty("cursor", "grabbing");
            document.body.style.setProperty("--cursor", "grabbing");
            initialDragOffset.current = dragX.get() - info.offset.x;
          }}
          onDragEnd={(e, info) => {
            // snap to an item
            // we subtract the last delta,
            // because it sometimes goes haywire on a cancelled drag
            const totalOffset =
              info.offset.x - info.delta.x + initialDragOffset.current;
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

            switchToItem(endingIndex);
            document.body.style.removeProperty("cursor");
            document.body.style.removeProperty("--cursor");
          }}
          onKeyDown={(e) => {
            // handle keyboard controls
            if (e.key === "ArrowRight") {
              switchToItem(activeItemIndex + 1);
            } else if (e.key === "ArrowLeft") {
              switchToItem(activeItemIndex - 1);
            }
          }}
        >
          {Array(NUM_ITEMS)
            .fill(null)
            .map((_, i) => (
              <MemoizedCarouselItem
                key={i}
                dragX={dragX}
                index={i}
                name="Blazin' Buffalo and Ranch Doritos"
                isInFront={i === activeItemIndex}
                switchToItem={switchToItem}
              />
            ))}
        </motion.div>
      </header>
    </div>
  );
}

// this component gets memoized, so make sure its
// props don't change much (i.e. don't pass the current index)
function CarouselItem(props: {
  dragX: MotionValue<number>;
  index: number;
  isInFront: boolean;
  switchToItem: (index: number) => void;
  name: string;
}) {
  const { dragX, index, isInFront, switchToItem } = props;

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

  // we imagine the items are on a semicircle,
  // so the scale decreases based on how "far" it is from the front
  const scale = useTransform(opacity, (o) => {
    const distanceFromCenter = 1 - o;

    // unit circle, pythagorean theorem (thanks, math class)
    const distanceFromFront = 1 - Math.sqrt(1 - distanceFromCenter ** 2);
    // this is the relative size of the items at the end of the semicircle
    const decreasedScaleAtBack = 0.7;
    return 1 - distanceFromFront * decreasedScaleAtBack;
  });

  // to get the left/right translation, we "curve" the progress around
  const translateX = useTransform(absoluteProgress, (progress) => {
    const radians = ((progress + 1) / 2) * Math.PI;
    const proportionTranslate = Math.cos(radians);
    const maxTranslateAmount = (CAROUSEL_WIDTH - ITEM_WIDTH) / 2;
    return proportionTranslate * maxTranslateAmount;
  });

  // the closer an item is to the front, the higher its z-index
  const zIndex = useTransform(opacity, (o) => Math.round(o * 20));

  const classNames = ["carousel-slide"];
  if (isInFront) {
    classNames.push("in-front");
  }
  return (
    <motion.div
      className={classNames.join(" ")}
      style={{
        opacity,
        scale,
        translateX,
        zIndex,
        position: "absolute",
        left: (CAROUSEL_WIDTH - ITEM_WIDTH) / 2,
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
      }}
    >
      <a
        href="https://reactjs.org"
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        role={!isInFront ? "button" : undefined}
        onDragStart={(e) => {
          // prevent browsers' default drag/drop behavior
          // (draggable=false doesn't always work)
          e.preventDefault();
        }}
        onMouseDown={(e) => {
          // prevent the scroll-on-click on mouse down,
          // since a user might be initiating a drag
          e.preventDefault();
        }}
        onClick={(e) => {
          if (dragX.isAnimating()) {
            // prevent links from being clicked as a drag ends
            e.preventDefault();
          } else if (!isInFront) {
            e.preventDefault();
            switchToItem(index);
            e.currentTarget.focus();
          }
        }}
        onKeyUp={(e) => {
          if (!isInFront && e.key === " ") {
            // emulate default button spacebar behavior
            // (this case shouldn't come up, since this becomes a link again on focus)
            switchToItem(index);
          }
        }}
        onFocus={() => {
          // keep! focused! items! in! view!
          switchToItem(index);
        }}
      >
        <img
          src={doritos}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          alt={isInFront ? props.name : `Scroll to ${props.name}`}
          draggable={false}
        />
      </a>
    </motion.div>
  );
}

const MemoizedCarouselItem = memo(CarouselItem);

interface CarouselControls {
  dragX: MotionValue<number>;
  activeItemIndex: number;
  switchToItem: (newIndex: number) => void;
}

// having the state of the carousel in this hook lets the user
// lift the state out of the carousel itself and have carousel buttons
function useCarouselControls(): CarouselControls {
  const dragX = useMotionValue(0);

  const [activeItemIndex, setActiveIndex] = useState(0);

  const switchToItem = useCallback(
    (newIndex: number) => {
      if (newIndex >= 0 && newIndex < NUM_ITEMS) {
        animate(dragX, newIndex * -ITEM_WIDTH);
        setActiveIndex(newIndex);
      }
    },
    [dragX]
  );

  return { dragX, activeItemIndex, switchToItem };
}

function CarouselButton(
  props: {
    controls: CarouselControls;
    direction: "prev" | "next";
  } & React.DetailedHTMLProps<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) {
  const { controls, direction, ...rest } = props;
  let disabled = props.disabled;
  if (direction === "prev" && controls.activeItemIndex <= 0) {
    disabled = true;
  } else if (
    direction === "next" &&
    controls.activeItemIndex >= NUM_ITEMS - 1
  ) {
    disabled = true;
  }
  return (
    <button
      {...rest}
      disabled={disabled}
      onClick={(e) => {
        if (direction === "prev") {
          controls.switchToItem(controls.activeItemIndex - 1);
        } else if (direction === "next") {
          controls.switchToItem(controls.activeItemIndex + 1);
        }
        if (rest.onClick) {
          rest.onClick(e);
        }
      }}
    />
  );
}

export default App;
