use std::fs::read_dir;

extern crate prost_build;

const DEFINITIONS_FOLDER: &str = "./api.zoeaubert.me-definitions";

fn find_proto_files_in_folder(folder: &str) -> Vec<String> {
    let mut files = Vec::new();

    for entry in read_dir(folder).unwrap() {
        let entry = entry;

        match entry {
            Ok(entry) => {
                let path = entry.path();

                match path.to_str() {
                    Some(path_as_str) => {
                        if path.is_dir() {
                            if let Some(path_as_str) = path.to_str() {
                                files.append(&mut find_proto_files_in_folder(path_as_str));
                            }
                        } else if let Some(extension) = path.extension() {
                            if extension != "proto" {
                                continue;
                            }
                            files.push(path_as_str.to_string());
                        }
                    }
                    None => continue,
                }
            }
            Err(_) => continue,
        };
    }

    files
}

fn main() {
    let files = find_proto_files_in_folder(DEFINITIONS_FOLDER);

    // prost_build::compile_protos(
    //     &[
    //         "src/protobuf/games.proto",
    //         "src/protobuf/lego.proto",
    //         "src/protobuf/about.proto",
    //         "src/protobuf/faq.proto",
    //     ],
    //     &["src/"],
    // )
    // .unwrap();

    println!("{:?}", files);

    prost_build::compile_protos(&files, &[DEFINITIONS_FOLDER]).unwrap();
}
