extern crate prost_build;

fn main() {
    prost_build::compile_protos(
        &[
            "src/protobuf/games.proto",
            "src/protobuf/lego.proto",
            "src/protobuf/about.proto",
            "src/protobuf/faq.proto",
        ],
        &["src/"],
    )
    .unwrap();
}
