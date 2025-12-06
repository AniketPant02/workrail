export default async function FolderDashboard({
    params,
}: {
    params: { folderID: string }
}) {
    const { folderID } = await params;

    return <div>{folderID}</div>
}