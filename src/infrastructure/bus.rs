use std::collections::VecDeque;

use tokio::{
    sync::mpsc::{channel, Receiver, Sender},
    time::{sleep, Duration},
};

use crate::{application::jobs::Job, prelude::*};

use super::app_state::{self, AppState};

pub trait BusJob {
    async fn run(&self, app_state: &AppState) -> Result<()>;
}

pub trait BusEvent {
    fn name(&self) -> &'static str;
}

pub struct Queue<J: BusJob + Send + Sync, E: BusEvent + Send + Sync> {
    app_state: AppState,
    jobs: VecDeque<J>,
    job_receiver: Receiver<J>,
    events: VecDeque<E>,
    event_receiver: Receiver<E>,
}

impl<J: BusJob + Send + Sync, E: BusEvent + Send + Sync> Queue<J, E> {
    pub fn new(
        app_state: AppState,
        job_receiver: Receiver<J>,
        event_receiver: Receiver<E>,
    ) -> Self {
        Self {
            app_state,
            jobs: VecDeque::new(),
            job_receiver,
            events: VecDeque::new(),
            event_receiver,
        }
    }

    pub async fn start(&mut self) {
        loop {
            while let Some(job) = self.jobs.pop_front() {
                match job.run(&self.app_state).await {
                    Ok(_) => {}
                    Err(err) => {
                        println!("Error running job: {}", err);
                    }
                }
            }

            while let Some(event) = self.events.pop_front() {
                println!("Event: {}", event.name());
            }

            sleep(Duration::from_millis(50)).await;
        }
    }
}
