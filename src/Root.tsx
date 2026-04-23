import { Composition } from "remotion";
import { MyComposition } from "./Composition";
import { NesraWellness } from "./NesraWellness";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="NesraAdvert"
        component={MyComposition}
        durationInFrames={765}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="NesraWellness"
        component={NesraWellness}
        durationInFrames={1560}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
