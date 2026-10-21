import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCredentialsList } from "../endpoints/credentials/list_GET.schema";
import { postIssue } from "../endpoints/credentials/issue_POST.schema";
import { postRevoke } from "../endpoints/credentials/revoke_POST.schema";
import { postTamper } from "../endpoints/credentials/tamper_POST.schema";
import { postVerify } from "../endpoints/credentials/verify_POST.schema";
import { postHolder } from "../endpoints/credentials/holder_POST.schema";

export const useCredentialsList = () =>
  useQuery({ queryKey: ["credentials"], queryFn: () => getCredentialsList() });

const useRefreshAll = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["credentials"] });
    qc.invalidateQueries({ queryKey: ["verify"] });
    qc.invalidateQueries({ queryKey: ["holder"] });
  };
};

export const useIssue = () => {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: (body: Parameters<typeof postIssue>[0]) => postIssue(body), onSuccess: refresh });
};

export const useRevoke = () => {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: (body: Parameters<typeof postRevoke>[0]) => postRevoke(body), onSuccess: refresh });
};

export const useTamper = () => {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: (body: Parameters<typeof postTamper>[0]) => postTamper(body), onSuccess: refresh });
};

export const useVerify = (credentialId: string, fileHash?: string) =>
  useQuery({
    queryKey: ["verify", credentialId, fileHash ?? null],
    queryFn: () => postVerify({ credentialId, fileHash }),
    retry: false,
    placeholderData: (prev) => prev,
  });

export const useHolder = (credentialId: string) =>
  useQuery({
    queryKey: ["holder", credentialId],
    queryFn: () => postHolder({ credentialId }),
    retry: false,
  });
