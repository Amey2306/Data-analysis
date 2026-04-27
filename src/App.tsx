/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from "./components/Dashboard";

export default function App() {
  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-900">
      <Dashboard />
    </div>
  );
}
