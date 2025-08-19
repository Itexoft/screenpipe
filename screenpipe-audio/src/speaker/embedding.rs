use anyhow::{Context, Result};
use ndarray::{Array2, ArrayViewD};
use ort::session::Session;
use ort::value::Value;
use std::path::Path;

#[derive(Debug)]
pub struct EmbeddingExtractor {
    session: Session,
}

impl EmbeddingExtractor {
    pub fn new<P: AsRef<Path>>(model_path: P) -> Result<Self> {
        let session = super::create_session(&model_path)?;
        Ok(Self { session })
    }
    pub fn compute(&mut self, samples: &[f32]) -> Result<impl Iterator<Item = f32>> {
        let features: Array2<f32> = knf_rs::compute_fbank(samples)
            .map_err(anyhow::Error::msg)
            .context("compute_fbank failed")?;
        let features = features.insert_axis(ndarray::Axis(0));
        let feats_val = Value::from_array(features.to_owned())?;
        let inputs = ort::inputs!["feats" => feats_val];
        let ort_outs = self.session.run(inputs)?;
        let ort_out: ArrayViewD<'_, f32> = ort_outs
            .get("embs")
            .context("Output tensor not found")?
            .try_extract_array()
            .context("Failed to extract array")?;
        let embeddings: Vec<f32> = ort_out.to_owned().into_raw_vec();
        Ok(embeddings.into_iter())
    }
}
