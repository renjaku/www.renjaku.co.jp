import { lightFormat } from "date-fns";

export function formatDate(value: string): string {
  return lightFormat(new Date(value), "yyyy 年 M 月 d 日");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

