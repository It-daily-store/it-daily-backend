import mongoose, { Schema, Document } from "mongoose";

interface ISlider {
  content: string;
  link: string;
}

interface IGridSliderTemplate extends Document {
  id: "gridSlider";
  active: boolean;
  data: {
    sliders: ISlider[];
    right_top: ISlider;
    right_bottom: ISlider;
  };
}

const SliderSchema: Schema = new Schema({
  content: { type: String, required: true },
  link: { type: String, required: true },
});

const GridSliderTemplateSchema: Schema = new Schema({
  id: { type: String, enum: ["gridSlider"], required: true },
  active: { type: Boolean, default: true },
  data: {
    sliders: { type: [SliderSchema], required: true },
    right_top: { type: SliderSchema, required: true },
    right_bottom: { type: SliderSchema, required: true },
  },
});

const Banner = mongoose.model<IGridSliderTemplate>(
  "banners",
  GridSliderTemplateSchema
);

export default Banner;
