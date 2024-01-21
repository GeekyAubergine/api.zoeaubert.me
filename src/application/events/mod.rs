use crate::infrastructure::bus::BusEvent;

pub enum Event {
    DataUpdated,
}

impl BusEvent for Event {
    fn name(&self) -> &'static str {
        match self {
            Event::DataUpdated => "data_updated",
        }
    }
}