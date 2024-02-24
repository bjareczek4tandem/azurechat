import { useGlobalMessageContext } from "@/features/global-message/global-message-context";
import {
  IndexDocuments,
  UploadDocument,
} from "../../chat-services/chat-document-service";
import { useChatContext } from "../chat-context";

interface Props {
  id: string;
}

export const useFileSelection = (props: Props) => {
  const { setChatBody, chatBody, fileState } = useChatContext();
  const { setIsUploadingFile, setUploadButtonLabel } = fileState;

  const { showError, showSuccess } = useGlobalMessageContext();

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    onFileChange(formData);
  };

  const onFileChange = async (formData: FormData) => {
    try {
      setIsUploadingFile(true);
      setUploadButtonLabel("Uploading documents...");
      formData.append("id", props.id);
      const files: File[] = formData.getAll("files") as unknown as File[];
      const uploadResponse = await UploadDocument(formData); //await Promise.all(files.map(file => UploadDocument(formData)));

        if (uploadResponse.success) {
          let index = 0;
          for (const doc of uploadResponse.response) {
            console.log(`Indexing document [${index + 1}]/[${uploadResponse.response.length}]`);
            setUploadButtonLabel(
              `Indexing document [${index + 1}]/[${
                uploadResponse.response.length
              }]`
            );
            try {
              // TODO: when we can step through, need to see why "index" is 4 and not 2 (1 for each doc).
              // Somehow need to get actual doc name, because seems we get 2 "doc" responses for each file uploaded.  Maybe more with larger files.
              const indexResponse = await IndexDocuments(
                files[0].name,
                [doc],
                props.id
              );
  
              if (!indexResponse.success) {
                showError(indexResponse.error);
                break;
              }
            } catch (e) {
              alert(e);
            }
            index++;
          }
          if (index === uploadResponse.response.length) {
            showSuccess({
              title: "File upload",
              description: `${index} docs for ${files.length} files uploaded successfully.`,
            });
            setUploadButtonLabel("");
            // TODO: need to do file NAMES.  Used to just allow 1 file at a time
            setChatBody({ ...chatBody, chatOverFileName: files[0].name });
          } else {
            showError(
              "Looks like not all documents were indexed. Please try again."
            );
          }
        } else {
          showError(uploadResponse.error);
        }
    } catch (error) {
      showError("" + error);
    } finally {
      setIsUploadingFile(false);
      setUploadButtonLabel("");
    }
  };

  return { onSubmit };
};
