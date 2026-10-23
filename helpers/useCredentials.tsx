import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCredentialsList } from "../endpoints/credentials/list_GET.schema";
import { postIssue } from "../endpoints/credentials/issue_POST.schema";
import { postRevoke } from "../endpoints/credentials/revoke_POST.schema";
import { postTamper } from "../endpoints/credentials/tamper_POST.schema";
import { postVerify } from "../endpoints/credentials/verify_POST.schema";
import { postHolder } from "../endpoints/credentials/holder_POST.schema";
import { getCopies } from "../endpoints/credentials/copies_GET.schema";
import { postCreateCopy } from "../endpoints/credentials/create_copy_POST.schema";
import { postDeactivateCopy } from "../endpoints/credentials/deactivate_copy_POST.schema";
import { getMisuseAlerts } from "../endpoints/credentials/misuse_alerts_GET.schema";

export const useCredentialsList = () =>
  useQuery({ queryKey: ["credentials"], queryFn: () => getCredentialsList() });

const useRefreshAll = () => {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["credentials"] });
    qc.invalidateQueries({ queryKey: ["verify"] });
    qc.invalidateQueries({ queryKey: ["holder"] });
    qc.invalidateQueries({ queryKey: ["copies"] });
    qc.invalidateQueries({ queryKey: ["misuse_alerts"] });
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

export const useCopies = (credentialId?: string) =>
  useQuery({
    queryKey: ["copies", credentialId ?? null],
    queryFn: () => getCopies(credentialId),
  });

export const useCreateCopy = () => {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (body: Parameters<typeof postCreateCopy>[0]) => postCreateCopy(body),
    onSuccess: refresh,
  });
};

export const useDeactivateCopy = () => {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: (body: Parameters<typeof postDeactivateCopy>[0]) => postDeactivateCopy(body),
    onSuccess: refresh,
  });
};

export const useMisuseAlerts = (credentialId?: string) =>
  useQuery({
    queryKey: ["misuse_alerts", credentialId ?? null],
    queryFn: () => getMisuseAlerts(credentialId),
  });

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
