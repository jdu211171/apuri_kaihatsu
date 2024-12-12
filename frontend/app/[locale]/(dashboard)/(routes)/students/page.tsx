"use client";

import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EllipsisVertical, File, Loader2 } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import Student from "@/types/student";
import StudentApi from "@/types/studentApi";
import PaginationApi from "@/components/PaginationApi";
import { Input } from "@/components/ui/input";
import { Link, usePathname, useRouter } from "@/navigation";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import TableApi from "@/components/TableApi";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";
import useApiQuery from "@/lib/useApiQuery";
import useApiMutation from "@/lib/useApiMutation";
import useFileMutation from "@/lib/useFileMutation";
import { useDebounce } from "@/hooks/useDebounce";
import { Checkbox } from "@/components/ui/checkbox";

export default function Students() {
  const t = useTranslations("students");
  const t1 = useTranslations("ThisStudent");
  const tName = useTranslations("names");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const debouncedSearch = useDebounce(search, 500);

  const {
    data: studentData,
    isLoading,
    error,
  } = useApiQuery<StudentApi>(
    `student/list?page=${page}&name=${debouncedSearch}`,
    ["students", page, debouncedSearch]
  );
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState<number | null>(null);
  const { mutate } = useApiMutation<{ message: string }>(
    `student/${studentId}`,
    "DELETE",
    ["deleteStudent"],
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["students"] });
        toast({
          title: t("studentDeleted"),
          description: data.message,
        });
      },
    }
  );
  const { mutate: exportStudents } = useFileMutation<{ message: string }>(
    `student/export`,
    ["exportStudents"]
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStudents(studentData?.students.map((s) => s.id) ?? []);
    } else {
      setSelectedStudents([]);
    }
  };

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => handleSelectAll(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedStudents.includes(row.original.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedStudents([...selectedStudents, row.original.id]);
            } else {
              setSelectedStudents(
                selectedStudents.filter((id) => id !== row.original.id)
              );
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: t("name"),
      cell: ({ row }) => (
        <Link href={`students/${row.original.id}`}>
          {tName("name", { ...row?.original, parents: "" })}
        </Link>
      ),
    },
    {
      accessorKey: "email",
      header: t("email"),
      cell: ({ row }) => (
        <Link href={`students/${row.original.id}`}>
          {row.getValue("email")}
        </Link>
      ),
    },
    {
      accessorKey: "student_number",
      header: t("studentId"),
      cell: ({ row }) => (
        <Link href={`students/${row.original.id}`}>
          {row.getValue("student_number")}
        </Link>
      ),
    },
    {
      accessorKey: "phone_number",
      header: t("phoneNumber"),
      cell: ({ row }) => (
        <Link href={`students/${row.original.id}`}>
          {row.getValue("phone_number")}
        </Link>
      ),
    },

    {
      header: t("action"),
      cell: ({ row }) => (
        <Dialog>
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger>
              <EllipsisVertical />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => router.push(`${pathname}/${row.original.id}`)}
              >
                {t("view")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`${pathname}/edit/${row.original.id}`)
                }
              >
                {t("edit")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`${pathname}/${row.original.id}/parents`)
                }
              >
                {t1("editParents")}
              </DropdownMenuItem>
              <DropdownMenuItem
                asChild
                className="text-destructive focus:text-destructive"
              >
                <DialogTrigger className="w-full">{t("delete")}</DialogTrigger>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {tName("name", { ...row?.original, parents: "" })}
              </DialogTitle>
              <DialogDescription>{row.original.email}</DialogDescription>
            </DialogHeader>
            <div>{t("DouYouDeleteStudent")}</div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant={"secondary"}>{t("cancel")}</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => {
                  setStudentId(row.original.id);
                  mutate();
                }}
              >
                {t("confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-semibold tracking-tight">
            {t("students")}
          </h1>
          <div className="flex items-center gap-4">
            {selectedStudents.length > 0 && (
              <Button
                variant="outline"
                onClick={() => exportStudents()}
                className="gap-2 px-4"
              >
                <File className="h-4 w-4" />
                {t("exportSelected")} ({selectedStudents.length})
              </Button>
            )}
            <Link href={`${pathname}/create`}>
              <Button className="px-6">{t("createstudent")}</Button>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="w-full max-w-md">
            <Input
              placeholder={t("placeholder")}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full"
            />
          </div>
          <PaginationApi
            data={studentData?.pagination ?? null}
            setPage={setPage}
          />
        </div>
      </div>

      <Card className="relative overflow-hidden shadow-sm">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        {error ? (
          <div className="p-8 text-center text-muted-foreground">
            {t("errorLoading")}
          </div>
        ) : (
          <TableApi data={studentData?.students ?? null} columns={columns} />
        )}
      </Card>
    </div>
  );
}
