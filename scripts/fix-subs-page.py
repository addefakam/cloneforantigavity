#!/usr/bin/env python3
import re

path = "/home/z/my-project/src/components/ghms/pages/subscriptions-page.tsx"
with open(path, "r") as f:
    content = f.read()

old = '''                  filtered.map((row) => (
                    <tr
                      key={row.subscriptionId}
                      className={`border-b hover:bg-slate-50 ${
                        row.status === "SUSPENDED" ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-slate-900">
                        {row.providerName}
                      </td>'''

new = '''                  filtered.map((row) => (
                    <tr
                      key={row.subscriptionId}
                      className={`border-b transition-colors ${
                        row.hasPendingVerification
                          ? "bg-orange-50 hover:bg-orange-100/70 border-l-4 border-l-orange-400"
                          : row.status === "SUSPENDED"
                          ? "bg-slate-50 hover:bg-slate-100"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{row.providerName}</span>
                          {row.hasPendingVerification && (
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 text-[10px] font-semibold gap-1 shrink-0">
                              <Eye className="w-3 h-3" />
                              Pending Approval
                            </Badge>
                          )}
                        </div>
                      </td>'''

if old in content:
    content = content.replace(old, new)
    with open(path, "w") as f:
        f.write(content)
    print("OK: replaced successfully")
else:
    print("ERROR: old string not found")
    # Debug: show what's actually there
    idx = content.find('filtered.map')
    if idx >= 0:
        print("Found at index", idx)
        print(repr(content[idx:idx+500]))
